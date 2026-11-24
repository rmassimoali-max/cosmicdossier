import { describe, expect, test } from "bun:test";
import { readDeletionBackendConfig } from "./deletion-backend-config.server";

const valid = {
  ACCOUNT_DELETION_BACKEND_ENABLED: "true",
  DELETION_DATABASE_URL:
    "postgresql://deletion_worker:example@db.example.com:5432/postgres?sslmode=verify-full",
  DELETION_CODE_HMAC_SECRET: "ab".repeat(32),
  RESEND_API_KEY: "re_example",
  DELETION_EMAIL_FROM: "Cosmic Dossier <security@example.com>",
};

describe("deletion backend activation gate", () => {
  test("defaults to disabled even when credentials exist", () => {
    expect(
      readDeletionBackendConfig({ ...valid, ACCOUNT_DELETION_BACKEND_ENABLED: "false" }),
    ).toBeNull();
    expect(readDeletionBackendConfig({})).toBeNull();
  });

  test("requires independent email, HMAC, and database configuration", () => {
    expect(() => readDeletionBackendConfig({ ...valid, DELETION_DATABASE_URL: "" })).toThrow();
    expect(() => readDeletionBackendConfig({ ...valid, RESEND_API_KEY: "" })).toThrow();
    expect(() => readDeletionBackendConfig({ ...valid, DELETION_CODE_HMAC_SECRET: "" })).toThrow();
  });

  test("rejects non-PostgreSQL URLs and insecure TLS modes", () => {
    for (const url of [
      "https://db.example.com",
      "postgresql://user:pass@db.example.com/postgres",
      "postgresql://user:pass@db.example.com/postgres?sslmode=disable",
      "postgresql://user:pass@db.example.com/postgres?sslmode=verify-full&host=evil",
      "postgresql://user:pass@localhost/postgres?sslmode=verify-full",
    ]) {
      expect(() => readDeletionBackendConfig({ ...valid, DELETION_DATABASE_URL: url })).toThrow();
    }
  });

  test("configuration errors never echo secrets or database credentials", () => {
    const password = "very-private-db-password";
    const apiKey = "re_super_private_provider_key";
    const hmac = "ab".repeat(32);
    const badConfig = {
      ...valid,
      DELETION_DATABASE_URL: `postgresql://deletion_worker:${password}@db.example.com/postgres?sslmode=disable`,
      RESEND_API_KEY: apiKey,
      DELETION_CODE_HMAC_SECRET: hmac,
    };
    let message = "";
    try {
      readDeletionBackendConfig(badConfig);
    } catch (error) {
      message = String(error);
    }
    expect(message).toContain("Deletion database");
    for (const sensitive of [password, apiKey, hmac, badConfig.DELETION_DATABASE_URL]) {
      expect(message).not.toContain(sensitive);
    }
  });

  test("accepts fully configured server-only settings without connecting", () => {
    const result = readDeletionBackendConfig(valid);
    expect(result?.email.from).toBe(valid.DELETION_EMAIL_FROM);
    expect(result?.secret).toHaveLength(32);
    expect(result?.databaseUrl).toBe(valid.DELETION_DATABASE_URL);
  });
});
