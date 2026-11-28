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
    stage = "code verification";
    const verified = await handlePostgresStoredDeletionVerification({
      ...input,
      encryptionKey,
      request: request({ challengeId: issued.challengeId, code }),
    });
    if (!verified.verified) throw new Error("Verification failed.");
    const storage = createSessionAuthorizationStorage({
      storage: createPostgresDeletionAuthorizationStorage(db),
      key: encryptionKey,
      sessionToken: token,
    });
    stage = "authorization retrieval";
    const credentials = await storage.take();
    if (!credentials || (await storage.take()) !== null) {
      throw new Error("Storage single-use check failed.");
    }
    console.log("Fresh authorization retrieved: PASS");
    stage = "authorization expiration";
    console.log("Waiting 310 seconds for the database authorization to expire...");
    await new Promise((resolve) => setTimeout(resolve, 310000));
    if (
      await consumeAuthenticatedDeletionAuthorization({
        ...input,
        accessToken: token,
        ...credentials,
      })
    ) {
      throw new Error("Expired authorization accepted.");
    }
    console.log("Expired authorization rejection: PASS");
    stage = "post-test account verification";
    if ((await getIdentity(token)).id !== identity.id) {
      throw new Error("Account verification failed.");
    }
    console.log("Disposable account still authenticated: PASS");
    console.log("Development authorization expiry: PASS. No account deletion invoked.");
  } finally {
    await db.close();
  }
}

run().catch(() => {
  console.error(`Development authorization expiry failed or cancelled at: ${stage}.`);
  process.exitCode = 1;
});
