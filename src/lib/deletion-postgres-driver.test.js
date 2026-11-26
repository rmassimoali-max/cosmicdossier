import { describe, expect, test } from "bun:test";
import { openDeletionPostgres } from "./deletion-postgres-driver.server";

describe("PostgreSQL deletion driver activation", () => {
  test("disabled driver needs no credentials", async () => {
    expect(await openDeletionPostgres({})).toBeNull();
  });

  test("production is rejected before opening a connection", async () => {
    await expect(
      openDeletionPostgres({
        ACCOUNT_DELETION_BACKEND_ENABLED: "true",
        VERCEL_ENV: "production",
      }),
    ).rejects.toThrow("isolated preview");
  });
});
