import { describe, expect, test } from "bun:test";
import {
  checkDeletionChallenge,
  DELETION_MAX_ATTEMPTS,
  issueDeletionChallenge,
} from "./deletion-challenge";

describe("account deletion challenge guards", () => {
  const now = 1_000_000;
  test("accepts a matching unexpired challenge only as a validation primitive", () => {
    const { token, record } = issueDeletionChallenge("user-a", now);
    expect(checkDeletionChallenge(record, "user-a", token, now + 1000)).toBe(true);
  });
  test("rejects another account or invalid token", () => {
    const { token, record } = issueDeletionChallenge("user-a", now);
    expect(checkDeletionChallenge(record, "user-b", token, now)).toBe(false);
    expect(checkDeletionChallenge(record, "user-a", "0".repeat(64), now)).toBe(false);
    expect(checkDeletionChallenge(record, "user-a", "12345678", now)).toBe(false);
  });
  test("rejects expired, consumed, and exhausted challenges", () => {
    const { token, record } = issueDeletionChallenge("user-a", now);
    expect(checkDeletionChallenge(record, "user-a", token, record.expiresAt)).toBe(false);
    expect(
      checkDeletionChallenge({ ...record, consumedAt: now }, "user-a", token, now),
    ).toBe(false);
    expect(
      checkDeletionChallenge(
        { ...record, attempts: DELETION_MAX_ATTEMPTS },
        "user-a",
        token,
        now,
      ),
    ).toBe(false);
  });
  test("does not generate reusable challenges", () => {
    const a = issueDeletionChallenge("user-a", now);
    const b = issueDeletionChallenge("user-a", now);
    expect(a.token).not.toBe(b.token);
    expect(a.record.tokenHash).not.toBe(b.record.tokenHash);
  });
});
