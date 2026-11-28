import { expect, test } from "bun:test";
import { requireFreshAuthRequest } from "./deletion-fresh-auth-request-guard.server";

const origin = "https://example.com";
const token = "a".repeat(64);

function fixture(overrides = {}) {
  const calls = [];
  return {
    calls,
    input: {
      request: new Request(origin, {
        method: "POST",
        headers: { origin, host: "example.com", "x-csrf-token": token, ...overrides },
      }),
      expectedOrigin: origin,
      verifyCsrf: async (value) => {
        calls.push("csrf");
        return value === token;
      },
      reserveAttempt: async () => {
        calls.push("rate");
        return true;
      },
    },
  };
}

test("valid requests verify CSRF before reserving an attempt", async () => {
  const { input, calls } = fixture();
  await requireFreshAuthRequest(input);
  expect(calls).toEqual(["csrf", "rate"]);
});

test("foreign origins, wrong hosts and malformed tokens never reserve attempts", async () => {
  for (const headers of [
    { origin: "https://evil.example" },
    { host: "evil.example" },
    { "x-csrf-token": "" },
  ]) {
    const { input, calls } = fixture(headers);
    await expect(requireFreshAuthRequest(input)).rejects.toThrow();
    expect(calls).toEqual([]);
  }
});

test("denied CSRF or rate reservation fails closed", async () => {
  const { input, calls } = fixture();
  await expect(
    requireFreshAuthRequest({ ...input, verifyCsrf: async () => false }),
  ).rejects.toThrow();
  expect(calls).toEqual([]);
  await expect(
    requireFreshAuthRequest({ ...input, reserveAttempt: async () => false }),
  ).rejects.toThrow();
  await expect(
    requireFreshAuthRequest({
      ...input,
      reserveAttempt: async () => {
        throw new Error("Unavailable");
      },
    }),
  ).rejects.toThrow();
});
