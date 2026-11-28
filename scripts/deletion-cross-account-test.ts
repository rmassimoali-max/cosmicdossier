import { requireDeletionVerificationPreflight } from "../src/lib/deletion-preflight.server";
import { spawnSync } from "node:child_process";
import { openDeletionPostgres } from "../src/lib/deletion-postgres-driver.server";
import { handleDeletionCodeRequest } from "../src/lib/deletion-http-request.server";
import { handlePostgresStoredDeletionVerification } from "../src/lib/deletion-http-postgres-verification.server";
import { createPostgresDeletionAuthorizationStorage } from "../src/lib/deletion-postgres-storage.server";
import { createSessionAuthorizationStorage } from "../src/lib/deletion-session-storage.server";
import { consumeAuthenticatedDeletionAuthorization } from "../src/lib/deletion-authenticated-consume.server";

let stage = "configuration";

async function run() {
  const env = process.env;
  if (env.VERCEL_ENV !== "preview" || env.DELETION_LIVE_TEST !== "true") {
    throw new Error("Explicit development test configuration required.");
  }
  const authUrl = "https://umcpchdifhxhxvhnatxo.supabase.co";
  const publishableKey = env.DELETION_TEST_PUBLISHABLE_KEY ?? "";
  const key = env.DELETION_TEST_ENCRYPTION_KEY;
  if (!publishableKey || !key || !/^[0-9a-f]{64}$/.test(key)) {
    throw new Error("Missing test configuration.");
  }
  if (env.SUPABASE_URL !== authUrl || !process.stdin.isTTY) {
    throw new Error("Interactive development environment required.");
  }
  const emailA = "deletion-test-a@example.com";
  const emailB = "deletion-test-b@example.com";
  async function login(email: string) {
    stage = "private password prompt for " + email;
    const password = spawnSync(
      "bash",
      [
        "-c",
        'read -r -s -p "Disposable account password: " password </dev/tty; printf "\\n" >/dev/tty; printf "%s" "$password"',
      ],
      { encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] },
    );
    if (password.status !== 0 || !password.stdout) throw new Error("Login cancelled.");
    stage = "disposable account login";
    const body = JSON.stringify({ email, password: password.stdout });
    password.stdout = "";
    const response = await fetch(authUrl + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: publishableKey, "Content-Type": "application/json" },
      body,
    });
    if (!response.ok) throw new Error("Login failed.");
    const token = (await response.json()).access_token;
    if (typeof token !== "string" || !token) throw new Error("Missing session.");
    const identity = await getIdentity(token);
    if (identity.email !== email || !identity.email_confirmed_at) {
      throw new Error("Unexpected test identity.");
    }
    return { token, identity };
  }
  async function getIdentity(token: string) {
    const response = await fetch(authUrl + "/auth/v1/user", {
      headers: { apikey: publishableKey, Authorization: "Bearer " + token },
    });
    if (!response.ok) throw new Error("Identity verification failed.");
    return response.json();
  }
  console.log("Account A: " + emailA);
  const { token, identity } = await login(emailA);
  console.log("Account B: " + emailB);
  const { token: secondToken, identity: secondIdentity } = await login(emailB);
  if (!identity.id || !secondIdentity.id || identity.id === secondIdentity.id) {
    throw new Error("Distinct accounts required.");
  }
  stage = "database connection";
  const db = await openDeletionPostgres(env);
  if (!db) throw new Error("Development backend disabled.");
  try {
    const origin = "https://development-test.invalid";
    const input = {
      env,
      expectedOrigin: origin,
      authUrl,
      publishableKey,
      getSessionToken: () => token,
      db,
    };
    const request = (body: object) =>
      new Request(origin + "/account", {
        method: "POST",
        headers: { origin, host: "development-test.invalid" },
        body: JSON.stringify(body),
      });
    stage = "email preflight";
    await requireDeletionVerificationPreflight({
      ...input,
      method: "POST",
      origin,
      host: "development-test.invalid",
      accessToken: token,
    });
    stage = "controlled challenge creation";
    let code = "";
    const issued = await handleDeletionCodeRequest({
      ...input,
      request: request({}),
      sender: async (_config, recipient, candidate) => {
        if (recipient !== emailA) throw new Error("Unexpected fixture recipient.");
        code = candidate;
        return { sent: true };
      },
    });
    if (!issued.sent || !code) throw new Error("Fixture issuance failed.");
    const encryptionKey = Buffer.from(key, "hex");
    const verify = (candidate: string, sessionToken = token) =>
      handlePostgresStoredDeletionVerification({
        ...input,
        encryptionKey,
        getSessionToken: () => sessionToken,
        request: request({ challengeId: issued.challengeId, code: candidate }),
      });
    const expectRejected = async (candidate: string, sessionToken = token) => {
      try {
        await verify(candidate, sessionToken);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Deletion verification code was invalid, expired, or already used."
        ) {
          return;
        }
        throw error;
      }
      throw new Error("Unexpected verification success.");
    };
    if (!/^\d{8}$/.test(code)) throw new Error("Invalid code format.");
    stage = "cross-account code rejection";
    await expectRejected(code, secondToken);
    console.log("Cross-account code rejection: PASS");
    stage = "incorrect code rejection";
    await expectRejected((code[0] === "0" ? "1" : "0") + code.slice(1));
    console.log("Incorrect code rejection: PASS");
    stage = "code verification";
    const verified = await verify(code);
    if (!verified.verified) throw new Error("Verification failed.");
    stage = "authorization storage";
    const storage = createSessionAuthorizationStorage({
      storage: createPostgresDeletionAuthorizationStorage(db),
      key: encryptionKey,
      sessionToken: token,
    });
    stage = "storage slot isolation";
    const otherSlot = createSessionAuthorizationStorage({
      storage: createPostgresDeletionAuthorizationStorage(db),
      key: encryptionKey,
      sessionToken: secondToken,
    });
    if ((await otherSlot.take()) !== null) throw new Error("Storage isolation failed.");
    console.log("Cross-account storage isolation: PASS");
    stage = "verification code replay";
    await expectRejected(code);
    console.log("Verification code replay rejection: PASS");
    stage = "authorization storage";
    const credentials = await storage.take();
    if (!credentials || (await storage.take()) !== null) {
      throw new Error("Storage single-use check failed.");
    }
    stage = "authorization consumption";
    const consume = (accessToken = token) =>
      consumeAuthenticatedDeletionAuthorization({ ...input, accessToken, ...credentials });
    if (await consume(secondToken)) throw new Error("Cross-account consumption succeeded.");
    console.log("Cross-account authorization rejection: PASS");
    if (!(await consume()) || (await consume())) throw new Error("Consumption check failed.");
    stage = "post-test account verification";
    const after = await fetch(authUrl + "/auth/v1/user", {
      headers: { apikey: publishableKey, Authorization: "Bearer " + token },
    });
    if (!after.ok || (await after.json()).id !== identity.id) {
      throw new Error("Account verification failed.");
    }
    if ((await getIdentity(secondToken)).id !== secondIdentity.id) {
      throw new Error("Second account verification failed.");
    }
    console.log("Both disposable accounts still authenticated: PASS");
    console.log("Development cross-account lifecycle: PASS. No account deletion invoked.");
  } finally {
    await db.close();
  }
}

run().catch(() => {
  console.error(`Development authorization lifecycle failed or cancelled at: ${stage}.`);
  process.exitCode = 1;
});
