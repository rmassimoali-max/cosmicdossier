import { describe, expect, test } from "bun:test";
import { getAuthCallbackUrl, readSupabasePublicConfig } from "./supabase-config";

describe("Supabase public configuration", () => {
  test("remains disabled without credentials", () => {
    expect(readSupabasePublicConfig({})).toBeNull();
  });

  test("accepts HTTPS project URL and publishable key", () => {
    expect(
      readSupabasePublicConfig({
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    });
  });

  test("rejects non-HTTPS remote endpoints", () => {
    expect(() =>
      readSupabasePublicConfig({
        SUPABASE_URL: "http://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toThrow();
  });

  test("uses the fixed callback path", () => {
    expect(getAuthCallbackUrl("https://www.cosmicdossier.com")).toBe(
      "https://www.cosmicdossier.com/auth/callback",
    );
  });

  test("rejects insecure production callback", () => {
    expect(() => getAuthCallbackUrl("http://www.cosmicdossier.com")).toThrow();
  });
});
