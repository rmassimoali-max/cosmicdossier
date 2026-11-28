import { expect, test } from "bun:test";
import {
  createFreshAuthRateReservation,
  FRESH_AUTH_RESERVE_SQL,
} from "./deletion-fresh-auth-rate.server";

const userId = "11111111-1111-4111-8111-111111111111";

test("reservation uses the verified account and exact parameterized SQL", async () => {
  const reserve = createFreshAuthRateReservation(
    {
      async query(statement, params) {
        expect(statement).toBe(FRESH_AUTH_RESERVE_SQL);
        expect(params).toEqual([userId]);
        return { rows: [{ reserved: true }] };
      },
    },
    userId,
  );
  expect(await reserve()).toBe(true);
});

test("only a single affirmative database result permits an attempt", async () => {
  for (const rows of [
    [],
    [{ reserved: false }],
    [{ reserved: "true" }],
    [{}],
    [{ reserved: true }, { reserved: true }],
  ]) {
    const reserve = createFreshAuthRateReservation({ query: async () => ({ rows }) }, userId);
    expect(await reserve()).toBe(false);
  }
});

test("invalid account or unavailable database cannot permit an attempt", async () => {
  const db = {
    async query() {
      throw new Error("Unavailable");
    },
  };
  expect(await createFreshAuthRateReservation(db, "")()).toBe(false);
  await expect(createFreshAuthRateReservation(db, userId)()).rejects.toThrow();
});
