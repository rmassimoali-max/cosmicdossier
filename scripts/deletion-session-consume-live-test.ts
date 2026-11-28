import { requireDeletionVerificationPreflight } from "../src/lib/deletion-preflight.server";
import { spawnSync } from "node:child_process";
import { openDeletionPostgres } from "../src/lib/deletion-postgres-driver.server";
import { handleDeletionCodeRequest } from "../src/lib/deletion-http-request.server";
import { handlePostgresStoredDeletionVerification } from "../src/lib/deletion-http-postgres-verification.server";
import { consumeSessionDeletionAuthorization } from "../src/lib/deletion-session-consume.server";

let stage = "configuration";

async function run() {
  const env = process.env;
  if (env.VERCEL_ENV !== "preview" || env.DELETION_LIVE_TEST !== "true") {
    throw new Error("Explicit development test configuration required.");
  }
  const authUrl = "https://umcpchdifhxhxvhnatxo.supabase.co";
  const publishableKey = env.DELETION_TEST_PUBLISHABLE_KEY;
  const key = env.DELETION_TEST_ENCRYPTION_KEY;
  if (!publishableKey || !key || !/^[0-9a-f]{64}$/.test(key)) {
    throw new Error("Missing test configuration.");
  }
  if (env.SUPABASE_URL !== authUrl || !process.stdin.isTTY) {
    throw new Error("Interactive development environment required.");
  }
  // Read from the controlling terminal with echo disabled; never persist credentials.
  stage = "private password prompt";
  const password = spawnSync(
    "bash",
    [
      "-c",
      'read -r -s -p "Development account password: " password </dev/tty; printf "\\n" >/dev/tty; printf "%s" "$password"',
    ],
    { encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] },
  );
  if (password.status !== 0 || !password.stdout) throw new Error("Login cancelled.");
  stage = "development login";
  const login = await fetch(authUrl + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "deletion-test-a@example.com", password: password.stdout }),
  });
  stage = "independent development login";
  const secondLogin = await fetch(authUrl + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "deletion-test-a@example.com", password: password.stdout }),
  });
  password.stdout = "";
  if (!secondLogin.ok) throw new Error("Independent login failed.");
  const secondSession = await secondLogin.json();
  const secondToken = secondSession.access_token;
  if (typeof secondToken !== "string" || !secondToken) {
    throw new Error("Missing independent session.");
  }
  stage = "development login";
  if (!login.ok) throw new Error("Development login failed.");
  const session = await login.json();
  const token = session.access_token;
  if (typeof token !== "string" || !token) throw new Error("Missing session.");
  stage = "independent session verification";
  const sessionId = (value: string) =>
    JSON.parse(Buffer.from(value.split(".")[1] ?? "", "base64url").toString()).session_id;
  if (!sessionId(token) || !sessionId(secondToken) || sessionId(token) === sessionId(secondToken)) {
    throw new Error("Independent sessions required.");
  }
  const secondIdentity = await fetch(authUrl + "/auth/v1/user", {
    headers: { apikey: publishableKey, Authorization: "Bearer " + secondToken },
  });
  if (!secondIdentity.ok || (await secondIdentity.json()).email !== "deletion-test-a@example.com") {
    throw new Error("Independent identity verification failed.");
  }
  stage = "identity verification";
  const response = await fetch(authUrl + "/auth/v1/user", {
    headers: { apikey: publishableKey, Authorization: "Bearer " + token },
  });
  if (!response.ok) throw new Error("Development authentication failed.");
  const identity = await response.json();
  if (identity.email !== "deletion-test-a@example.com" || !identity.email_confirmed_at) {
    throw new Error("Unexpected test identity.");
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
    stage = "database challenge creation";
    let code = "";
    const issued = await handleDeletionCodeRequest({
      ...input,
      request: request({}),
      sender: async (_config, recipient, candidate) => {
        if (recipient !== "deletion-test-a@example.com") throw new Error("Unexpected recipient.");
        code = candidate;
        return { sent: true };
      },
    });
    if (!issued.sent || !code) throw new Error("Controlled delivery failed.");
    const encryptionKey = Buffer.from(key, "hex");
    const verify = (candidate: string) =>
      handlePostgresStoredDeletionVerification({
        ...input,
        encryptionKey,
        request: request({ challengeId: issued.challengeId, code: candidate }),
      });
    const expectRejected = async (candidate: string) => {
      try {
        await verify(candidate);
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
    stage = "incorrect code rejection";
    await expectRejected((code[0] === "0" ? "1" : "0") + code.slice(1));
    console.log("Incorrect code rejection: PASS");
    stage = "code verification";
    const verified = await verify(code);
    if (!verified.verified) throw new Error("Verification failed.");
    stage = "independent session rejection";
    const consume = (accessToken: string) =>
      consumeSessionDeletionAuthorization({ ...input, encryptionKey, accessToken });
    if (await consume(secondToken)) throw new Error("Independent session accepted.");
    console.log("Independent authenticated session rejection: PASS");
    stage = "verification code replay";
    await expectRejected(code);
    console.log("Verification code replay rejection: PASS");
    stage = "owner session consumption";
    if (!(await consume(token))) throw new Error("Owner consumption failed.");
    console.log("Owner session consumption: PASS");
    stage = "authorization replay";
    if (await consume(token)) throw new Error("Authorization replay accepted.");
    console.log("Authorization replay rejection: PASS");
    stage = "post-test account verification";
    const after = await fetch(authUrl + "/auth/v1/user", {
      headers: { apikey: publishableKey, Authorization: "Bearer " + token },
    });
    if (!after.ok || (await after.json()).id !== identity.id) {
      throw new Error("Account verification failed.");
    }
    console.log("Development account still authenticated: PASS");
    console.log("Development authorization lifecycle: PASS. No account deletion invoked.");
  } finally {
    await db.close();
  }
}

run().catch(() => {
  console.error(`Development authorization lifecycle failed or cancelled at: ${stage}.`);
  process.exitCode = 1;
});
