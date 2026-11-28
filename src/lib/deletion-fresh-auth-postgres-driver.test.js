import { describe, expect, test } from "bun:test";
import { openFreshAuthPostgres } from "./deletion-fresh-auth-postgres-driver.server";

describe("PostgreSQL fresh-auth driver activation", () => {
  test("disabled driver needs no credentials", async () => {
    expect(await openFreshAuthPostgres({})).toBeNull();
  });

  test("production is rejected before opening a connection", async () => {
    await expect(
      openFreshAuthPostgres({
        ACCOUNT_DELETION_FRESH_AUTH_ENABLED: "true",
        VERCEL_ENV: "production",
      }),
    ).rejects.toThrow("isolated preview");
  });
});
