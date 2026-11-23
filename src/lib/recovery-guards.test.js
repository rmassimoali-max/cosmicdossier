import { describe, expect, test } from "bun:test";
import { hasRecoveryAuthorization, recoveryTokenFromUrl } from "./recovery-guards";

const hash = "a".repeat(64);

describe("recovery-only browser link acceptance", () => {
  test("accepts a recovery-specific OTP hash in a URL fragment", () => {
    expect(recoveryTokenFromUrl("", `#token_hash=${hash}&type=recovery`)).toBe(hash);
  });
  test("accepts a recovery-specific OTP hash in query parameters", () => {
    expect(recoveryTokenFromUrl(`?token_hash=${hash}&type=recovery`, "")).toBe(hash);
  });
  test("rejects an ordinary authenticated session, even if labeled recovery", () => {
    expect(recoveryTokenFromUrl("", "#access_token=ordinary&refresh_token=ordinary&type=recovery")).toBeNull();
  });
  test("rejects a recovery hash combined with an ordinary access token", () => {
    expect(recoveryTokenFromUrl("", `#token_hash=${hash}&type=recovery&access_token=ordinary`)).toBeNull();
  });
  test("rejects signup and magic-link token hashes", () => {
    expect(recoveryTokenFromUrl("", `#token_hash=${hash}&type=signup`)).toBeNull();
    expect(recoveryTokenFromUrl("", `#token_hash=${hash}&type=magiclink`)).toBeNull();
  });
  test("rejects missing, short, and oversized hashes", () => {
    expect(recoveryTokenFromUrl("", "#type=recovery")).toBeNull();
    expect(recoveryTokenFromUrl("", "#token_hash=short&type=recovery")).toBeNull();
    expect(recoveryTokenFromUrl("", `#token_hash=${"a".repeat(2049)}&type=recovery`)).toBeNull();
  });
});

describe("server-side recovery authorization", () => {
  test("rejects a normal signed-in session without a recovery marker", () => {
    expect(hasRecoveryAuthorization("valid-login-access-token", undefined)).toBe(false);
    expect(hasRecoveryAuthorization("valid-login-access-token", "0")).toBe(false);
  });
  test("rejects a recovery marker without an access token", () => {
    expect(hasRecoveryAuthorization(undefined, "1")).toBe(false);
    expect(hasRecoveryAuthorization("", "1")).toBe(false);
  });
  test("requires both an access token and an explicit recovery marker", () => {
    expect(hasRecoveryAuthorization("verified-recovery-access-token", "1")).toBe(true);
  });
});
