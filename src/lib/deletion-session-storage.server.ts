import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

const TTL_MS = 4 * 60 * 1000;

/** A private durable store must enforce TTL and atomic take across instances. */
export type DeletionAuthorizationStorage = {
  put(key: string, value: string, ttlMs: number): Promise<void>;
  take(key: string): Promise<string | null>;
};

export function createSessionAuthorizationStorage(input: {
  storage: DeletionAuthorizationStorage;
  key: Buffer;
  sessionToken: string;
  now?: () => number;
}) {
  if (input.key.length !== 32 || !input.sessionToken) {
    throw new Error("Secure authorization storage is not configured.");
  }
  const slot = createHmac("sha256", input.key)
    .update("deletion-session-v1:")
    .update(input.sessionToken)
    .digest("hex");
  const aad = Buffer.from("deletion-authorization-v1:" + slot);
  const now = input.now ?? Date.now;

  return {
    async save(authorization: { authorizationId: string; authorizationSecret: string }) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", input.key, iv);
      cipher.setAAD(aad);
      const payload = JSON.stringify({ ...authorization, expiresAt: now() + TTL_MS });
      const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
      const envelope = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
      await input.storage.put(slot, envelope, TTL_MS);
    },
    async take() {
      const envelope = await input.storage.take(slot);
      if (!envelope) return null;
      try {
        const bytes = Buffer.from(envelope, "base64");
        const decipher = createDecipheriv("aes-256-gcm", input.key, bytes.subarray(0, 12));
        decipher.setAAD(aad);
        decipher.setAuthTag(bytes.subarray(12, 28));
        const plaintext = Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]);
        const value = JSON.parse(plaintext.toString("utf8"));
        if (
          typeof value.expiresAt !== "number" ||
          value.expiresAt <= now() ||
          typeof value.authorizationId !== "string" ||
          typeof value.authorizationSecret !== "string" ||
          !/^[0-9a-f]{64}$/.test(value.authorizationSecret)
        ) {
          return null;
        }
        return {
          authorizationId: value.authorizationId as string,
          authorizationSecret: value.authorizationSecret as string,
        };
      } catch {
        return null;
      }
    },
  };
}
