import { describe, expect, test } from "bun:test";
import { openDevelopmentFreshAuthConnection } from "./deletion-fresh-auth-connection.server";

const env = {
  ACCOUNT_DELETION_FRESH_AUTH_ENABLED: "true",
  VERCEL_ENV: "preview",
  DELETION_FRESH_AUTH_DATABASE_CA:
    "-----BEGIN CERTIFICATE-----\nfixture\n-----END CERTIFICATE-----",
  DELETION_FRESH_AUTH_DATABASE_URL:
    "postgresql://deletion_fresh_auth_worker.umcpchdifhxhxvhnatxo:example@aws-1-us-east-2.pooler.supabase.com/postgres?sslmode=verify-full",
};

describe("development fresh-auth connection", () => {
  test("disabled gate never connects", async () => {
    expect(
      await openDevelopmentFreshAuthConnection({
        env: {},
        connect: async () => {
          throw new Error("unexpected connection");
        },
      }),
    ).toBeNull();
  });

  test("rejects production and unexpected hosts before connecting", async () => {
    for (const bad of [
      { ...env, VERCEL_ENV: "production" },
      {
        ...env,
        DELETION_FRESH_AUTH_DATABASE_URL: env.DELETION_FRESH_AUTH_DATABASE_URL.replace(
          "aws-1-us-east-2.pooler.supabase.com",
          "aws-0-us-east-2.pooler.supabase.com",
        ),
      },
      {
        ...env,
        DELETION_FRESH_AUTH_DATABASE_URL: env.DELETION_FRESH_AUTH_DATABASE_URL.replace(
          "umcpchdifhxhxvhnatxo",
          "hbxvkmxxvokiwwyythvh",
        ),
      },
      {
        ...env,
        DELETION_FRESH_AUTH_DATABASE_URL: env.DELETION_FRESH_AUTH_DATABASE_URL.replace(
          "verify-full",
          "disable",
        ),
      },
    ]) {
      let called = false;
      await expect(
        openDevelopmentFreshAuthConnection({
          env: bad,
          connect: async () => {
            called = true;
            throw new Error("unexpected connection");
          },
        }),
      ).rejects.toThrow();
      expect(called).toBe(false);
    }
  });

  test("missing or malformed CA never connects", async () => {
    for (const ca of [undefined, "invalid"]) {
      await expect(
        openDevelopmentFreshAuthConnection({
          env: { ...env, DELETION_FRESH_AUTH_DATABASE_CA: ca },
          connect: async () => {
            throw new Error("unexpected connection");
          },
        }),
      ).rejects.toThrow("CA is not configured");
    }
  });

  test("rejects unexpected database identity and closes connection", async () => {
    let closed = false;
    await expect(
      openDevelopmentFreshAuthConnection({
        env,
        connect: async (options) => {
          expect(options.ssl.rejectUnauthorized).toBe(true);
          expect(options.ssl.ca).toBe(env.DELETION_FRESH_AUTH_DATABASE_CA);
          return {
            query: async () => ({ rows: [{ allowed: false }] }),
            close: async () => {
              closed = true;
            },
          };
        },
      }),
    ).rejects.toThrow("Fresh-auth database connection unavailable.");
    expect(closed).toBe(true);
  });
});

test("rejects verification credentials and never falls back to them", async () => {
  for (const bad of [
    {
      ...env,
      DELETION_FRESH_AUTH_DATABASE_URL: undefined,
      DELETION_DATABASE_URL: env.DELETION_FRESH_AUTH_DATABASE_URL,
    },
    {
      ...env,
      DELETION_FRESH_AUTH_DATABASE_URL: env.DELETION_FRESH_AUTH_DATABASE_URL.replace(
        "deletion_fresh_auth_worker",
        "deletion_worker",
      ),
    },
  ]) {
    let called = false;
    await expect(
      openDevelopmentFreshAuthConnection({
        env: bad,
        connect: async () => {
          called = true;
          throw new Error("unexpected");
        },
      }),
    ).rejects.toThrow();
    expect(called).toBe(false);
  }
});

test("accepts only an affirmative identity check", async () => {
  const db = {
    query: async (statement, params) => {
      expect(statement).toContain("deletion_fresh_auth_backend");
      expect(statement).toContain("pg_has_role");
      expect(statement).toContain("cleanup_deletion_fresh_auth_flows");
      expect(params).toEqual([]);
      return { rows: [{ allowed: true }] };
    },
    close: async () => {},
  };
  expect(await openDevelopmentFreshAuthConnection({ env, connect: async () => db })).toBe(db);
});
