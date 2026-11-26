import { describe, expect, test } from "bun:test";
import { requireVerifiedDeletionIdentity } from "./deletion-identity.server";

const valid = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "owner@example.com",
  email_confirmed_at: "2026-11-24T10:00:00Z",
  is_anonymous: false,
};

describe("deletion identity gate", () => {
  test("accepts only the confirmed account identity", () => {
    expect(requireVerifiedDeletionIdentity(valid)).toEqual({
      userId: valid.id,
      verifiedEmail: valid.email,
    });
  });

  test("rejects unconfirmed and anonymous accounts", () => {
    for (const change of [
      { email_confirmed_at: null },
      { email_confirmed_at: "not-a-date" },
      { is_anonymous: true },
    ]) {
      expect(() => requireVerifiedDeletionIdentity({ ...valid, ...change })).toThrow();
    }
  });

  test("rejects missing, malformed, and absent account identifiers", () => {
    for (const change of [
      { id: null },
      { id: "other-account" },
      { email: null },
      { email: "not-an-email" },
      { email: "owner@example.com\nX-Test: injected" },
    ]) {
      expect(() => requireVerifiedDeletionIdentity({ ...valid, ...change })).toThrow();
    }
  });
});
