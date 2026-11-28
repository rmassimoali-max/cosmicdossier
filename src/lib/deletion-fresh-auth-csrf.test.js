import { expect, test } from "bun:test";
import { createFreshAuthCsrf } from "./deletion-fresh-auth-csrf.server";

const input = {
  key: "a".repeat(64),
  userId: "11111111-1111-4111-8111-111111111111",
  sessionId: "22222222-2222-4222-8222-222222222222",
};

test("CSRF tokens verify only with matching session, account and secret", async () => {
  const csrf = createFreshAuthCsrf(input);
  expect(csrf.token).toMatch(/^[0-9a-f]{64}$/);
  expect(await csrf.verify(csrf.token)).toBe(true);
  for (const overrides of [
    { key: "b".repeat(64) },
    { userId: "33333333-3333-4333-8333-333333333333" },
    { sessionId: "33333333-3333-4333-8333-333333333333" },
  ]) {
    const other = createFreshAuthCsrf({ ...input, ...overrides });
    expect(await other.verify(csrf.token)).toBe(false);
  }
});

test("malformed tokens and configuration fail closed", async () => {
  const csrf = createFreshAuthCsrf(input);
  for (const token of ["", "a", "g".repeat(64), "a".repeat(65)]) {
    expect(await csrf.verify(token)).toBe(false);
  }
  for (const overrides of [{ key: "" }, { userId: "" }, { sessionId: "" }]) {
    expect(() => createFreshAuthCsrf({ ...input, ...overrides })).toThrow();
  }
});
