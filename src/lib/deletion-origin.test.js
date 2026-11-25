import { describe, expect, test } from "bun:test";
import { requireDeletionRequestOrigin } from "./deletion-origin.server";

const valid = {
  method: "POST",
  origin: "https://www.cosmicdossier.com",
  host: "www.cosmicdossier.com",
  expectedOrigin: "https://www.cosmicdossier.com",
};

describe("deletion verification same-origin request guard", () => {
  test("allows an exact canonical same-origin POST", () => {
    expect(requireDeletionRequestOrigin(valid)).toBe(true);
  });

  test("rejects missing, cross-site and deceptive origins", () => {
    for (const origin of [
      null,
      "https://evil.example",
      "https://www.cosmicdossier.com.evil.example",
      "http://www.cosmicdossier.com",
      "https://www.cosmicdossier.com:444",
      "https://www.cosmicdossier.com/path",
      "https://www.cosmicdossier.com?x=1",
      "https://user@www.cosmicdossier.com",
      "null",
    ]) {
      expect(() => requireDeletionRequestOrigin({ ...valid, origin })).toThrow();
    }
  });

  test("rejects wrong methods and mismatched hosts", () => {
    expect(() => requireDeletionRequestOrigin({ ...valid, method: "GET" })).toThrow();
    expect(() =>
      requireDeletionRequestOrigin({ ...valid, host: "evil.example" }),
    ).toThrow();
    expect(() => requireDeletionRequestOrigin({ ...valid, host: null })).toThrow();
  });

  test("rejects a spoofed forwarded host when the real Host is wrong", () => {
    expect(() =>
      requireDeletionRequestOrigin({
        ...valid,
        host: "evil.example",
        forwardedHost: "www.cosmicdossier.com",
      }),
    ).toThrow();
  });

  test("rejects malformed canonical configuration", () => {
    expect(() =>
      requireDeletionRequestOrigin({
        ...valid,
        expectedOrigin: "https://www.cosmicdossier.com/path",
      }),
    ).toThrow();
  });
});
