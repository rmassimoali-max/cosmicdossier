import { expect, test } from "bun:test";
import { resolveDeletionAccountEvidence } from "./deletion-auth.server";

test("factor evidence is derived from the same verified account response", async () => {
  for (const [factors, expected] of [
    [[], false],
    [[{ status: "verified" }], true],
    [undefined, null],
    [[{}], null],
  ]) {
    const result = await resolveDeletionAccountEvidence({
      authUrl: "https://example.supabase.co",
      publishableKey: "test",
      accessToken: "token",
      fetcher: async (url, options) => {
        expect(url).toBe("https://example.supabase.co/auth/v1/user");
        expect(options.headers.Authorization).toBe("Bearer token");
        expect(options.redirect).toBe("error");
        return Response.json({
          id: "11111111-1111-4111-8111-111111111111",
          email: "test@example.com",
          email_confirmed_at: "2026-01-01T00:00:00Z",
          factors,
        });
      },
    });
    expect(result.hasVerifiedFactors).toBe(expected);
  }
});
