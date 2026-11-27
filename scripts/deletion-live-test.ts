import { requireDeletionVerificationPreflight } from "../src/lib/deletion-preflight.server";
import { sendDeletionVerificationEmail } from "../src/lib/deletion-email.server";
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
  const publishableKey = env.DELETION_TEST_PUBLISHABLE_KEY;
  const key = env.DELETION_TEST_ENCRYPTION_KEY;
  if (!publishableKey || !env.DELETION_TEST_EMAIL || !key || !/^[0-9a-f]{64}$/.test(key)) {
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
    body: JSON.stringify({ email: env.DELETION_TEST_EMAIL, password: password.stdout }),
  });
  password.stdout = "";
  if (!login.ok) throw new Error("Development login failed.");
  const session = await login.json();
  const token = session.access_token;
  if (typeof token !== "string" || !token) throw new Error("Missing session.");
  stage = "identity verification";
  const response = await fetch(authUrl + "/auth/v1/user", {
    headers: { apikey: publishableKey, Authorization: "Bearer " + token },
  });
  if (!response.ok) throw new Error("Development authentication failed.");
  const identity = await response.json();
  if (identity.email !== env.DELETION_TEST_EMAIL || !identity.email_confirmed_at) {
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
    const issued = await handleDeletionCodeRequest({
      ...input,
      request: request({}),
      sender: async (config, recipient, code) => {
        stage = "Resend email transport";
        const result = await sendDeletionVerificationEmail(config, recipient, code);
        stage = "database challenge activation";
        return result;
      },
    });
    if (!issued.sent) throw new Error("Email request failed.");
    console.log("Verification email requested.");
    stage = "code prompt";
    const code = prompt("Enter the development verification code:");
    if (!code) throw new Error("Test cancelled.");
    const encryptionKey = Buffer.from(key, "hex");
    stage = "code verification";
    const verified = await handlePostgresStoredDeletionVerification({
      ...input,
      encryptionKey,
      request: request({ challengeId: issued.challengeId, code }),
    });
    if (!verified.verified) throw new Error("Verification failed.");
    stage = "authorization storage";
    const storage = createSessionAuthorizationStorage({
      storage: createPostgresDeletionAuthorizationStorage(db),
      key: encryptionKey,
      sessionToken: token,
    });
    const credentials = await storage.take();
    if (!credentials || (await storage.take()) !== null) {
      throw new Error("Storage single-use check failed.");
    }
    stage = "authorization consumption";
    const consume = () =>
      consumeAuthenticatedDeletionAuthorization({ ...input, accessToken: token, ...credentials });
    if (!(await consume()) || (await consume())) throw new Error("Consumption check failed.");
    console.log("Development authorization lifecycle: PASS. No account deletion invoked.");
  } finally {
    await db.close();
  }
}

run().catch(() => {
  console.error(`Development authorization lifecycle failed or cancelled at: ${stage}.`);
  process.exitCode = 1;
});
