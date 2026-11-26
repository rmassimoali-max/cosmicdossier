import { describe, expect, test } from "bun:test";
import { openDevelopmentDeletionConnection } from "./deletion-connection.server";

const env = {
  ACCOUNT_DELETION_BACKEND_ENABLED: "true",
  VERCEL_ENV: "preview",
  DELETION_DATABASE_URL:
    "postgresql://deletion_worker:example@db.umcpchdifhxhxvhnatxo.supabase.co/postgres?sslmode=verify-full",
};

describe("development deletion connection", () => {
  test("disabled gate never connects", async () => {
    expect(
      await openDevelopmentDeletionConnection({
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
        DELETION_DATABASE_URL: env.DELETION_DATABASE_URL.replace(
          "umcpchdifhxhxvhnatxo",
          "hbxvkmxxvokiwwyythvh",
        ),
      },
      {
        ...env,
        DELETION_DATABASE_URL: env.DELETION_DATABASE_URL.replace("verify-full", "disable"),
      },
    ]) {
      let called = false;
      await expect(
        openDevelopmentDeletionConnection({
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

  test("rejects unexpected database identity and closes connection", async () => {
    let closed = false;
    await expect(
      openDevelopmentDeletionConnection({
        env,
        connect: async (options) => {
          expect(options.ssl.rejectUnauthorized).toBe(true);
          return {
            query: async () => ({ rows: [{ allowed: false }] }),
            close: async () => {
              closed = true;
            },
          };
        },
      }),
    ).rejects.toThrow("Deletion database connection unavailable.");
    expect(closed).toBe(true);
  });
});
