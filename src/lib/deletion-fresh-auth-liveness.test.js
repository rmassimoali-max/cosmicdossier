import { expect, test } from "bun:test";
import { requireActiveFreshAuthSession } from "./deletion-fresh-auth-liveness.server";

const evidence = {
  userId: "11111111-1111-4111-8111-111111111111",
  sessionId: "22222222-2222-4222-8222-222222222222",
  authenticatedAt: 1700000000000,
  method: "password",
};

test("liveness requires an affirmative result for the exact user and session", async () => {
  const result = await requireActiveFreshAuthSession(evidence, async (identity) => {
    expect(identity).toEqual({ userId: evidence.userId, sessionId: evidence.sessionId });
    return true;
  });
  expect(result).toEqual(evidence);
});

test("revoked, missing or malformed liveness results fail closed", async () => {
  for (const value of [false, null, undefined, "true", 1]) {
    await expect(requireActiveFreshAuthSession(evidence, async () => value)).rejects.toThrow();
  }
});

test("liveness provider errors prevent approval", async () => {
  await expect(
    requireActiveFreshAuthSession(evidence, async () => {
      throw new Error("Unavailable");
    }),
  ).rejects.toThrow();
});
