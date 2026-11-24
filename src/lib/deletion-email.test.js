import { describe, expect, test } from "bun:test";
import {
  readDeletionEmailConfig,
  sendDeletionVerificationEmail,
} from "./deletion-email.server";

describe("server-only deletion email transport", () => {
  test("stays disabled without configured server secrets", () => {
    expect(readDeletionEmailConfig({})).toBeNull();
    expect(readDeletionEmailConfig({ RESEND_API_KEY: "re_test" })).toBeNull();
  });

  test("validates sender and key configuration", () => {
    expect(() =>
      readDeletionEmailConfig({
        RESEND_API_KEY: "re_test",
        DELETION_EMAIL_FROM: "Injected\nBcc: someone@example.com",
      }),
    ).toThrow();
  });

  test("sends purpose-specific content only through injected transport", async () => {
    let called = 0;
    const mockFetch = async (url, options) => {
      called++;
      expect(url).toBe("https://api.resend.com/emails");
      const body = JSON.parse(options.body);
      expect(body.to).toEqual(["test@example.com"]);
      expect(body.text).toContain("12345678");
      expect(body.text).toContain("does not delete your account");
      return { ok: true };
    };
    const result = await sendDeletionVerificationEmail(
      { apiKey: "re_test", from: "Cosmic Dossier <security@example.com>" },
      "test@example.com",
      "12345678",
      mockFetch,
    );
    expect(result.sent).toBe(true);
    expect(called).toBe(1);
  });

  test("rejects malformed codes before sending", async () => {
    let called = false;
    const mockFetch = async () => {
      called = true;
      return { ok: true };
    };
    await expect(
      sendDeletionVerificationEmail(
        { apiKey: "re_test", from: "Cosmic Dossier <security@example.com>" },
        "test@example.com",
        "invalid",
        mockFetch,
      ),
    ).rejects.toThrow();
    expect(called).toBe(false);
  });
});
