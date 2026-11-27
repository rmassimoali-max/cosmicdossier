import { spawnSync } from "node:child_process";
import { openDeletionPostgres } from "../src/lib/deletion-postgres-driver.server";
import { handleDeletionCodeRequest } from "../src/lib/deletion-http-request.server";
import { handlePostgresStoredDeletionVerification } from "../src/lib/deletion-http-postgres-verification.server";

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
    const encryptionKey = Buffer.from(key, "hex");
    for (const fixture of [
      { email: emailA, token, expiry: false },
      { email: emailB, token: secondToken, expiry: true },
    ]) {
      stage = "controlled challenge issuance for " + fixture.email;
      let code = "";
      const issued = await handleDeletionCodeRequest({
        ...input,
        getSessionToken: () => fixture.token,
        request: request({}),
        ...(fixture.expiry ? { now: new Date(Date.now() - 570000) } : {}),
        sender: async (_config, recipient, candidate) => {
          if (recipient !== fixture.email) throw new Error("Unexpected fixture recipient.");
          code = candidate;
          return { sent: true };
        },
      });
      if (!issued.sent || !/^\d{8}$/.test(code)) throw new Error("Fixture issuance failed.");
      const reject = async (candidate: string) => {
        try {
          await handlePostgresStoredDeletionVerification({
            ...input,
            encryptionKey,
            getSessionToken: () => fixture.token,
            request: request({ challengeId: issued.challengeId, code: candidate }),
          });
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
      if (fixture.expiry) {
        stage = "challenge expiration";
        const remaining = Date.parse(issued.expiresAt) - Date.now();
        if (!Number.isFinite(remaining) || remaining <= 0 || remaining > 35000) {
          throw new Error("Unexpected fixture lifetime.");
        }
        console.log("Waiting for development challenge to expire...");
        await new Promise((resolve) => setTimeout(resolve, remaining + 2000));
        await reject(code);
        console.log("Expired correct code rejection: PASS");
      } else {
        stage = "five-attempt lockout";
        const wrong = (code[0] === "0" ? "1" : "0") + code.slice(1);
        for (let i = 0; i < 5; i++) await reject(wrong);
        await reject(code);
        console.log("Five incorrect attempts and subsequent correct code rejection: PASS");
      }
    }
    stage = "post-test account verification";
    if (
      (await getIdentity(token)).id !== identity.id ||
      (await getIdentity(secondToken)).id !== secondIdentity.id
    ) {
      throw new Error("Account verification failed.");
    }
    console.log("Both disposable accounts still authenticated: PASS");
    console.log("Development negative lifecycle: PASS. No account deletion invoked.");
  } finally {
    await db.close();
  }
}

run().catch(() => {
  console.error(`Development negative lifecycle failed or cancelled at: ${stage}.`);
  process.exitCode = 1;
});
