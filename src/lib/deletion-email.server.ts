/**
 * Server-only transport for purpose-specific account-deletion verification.
 * Not wired to a route. Never import this module from client components.
 * Resend sender domain must be verified before enabling delivery.
 */
export type DeletionEmailConfig = {
  apiKey: string;
  from: string;
};

export function readDeletionEmailConfig(env: Record<string, string | undefined>) {
  const apiKey = env["RESEND_API_KEY"];
  const from = env["DELETION_EMAIL_FROM"];
  if (!apiKey || !from) return null;
  if (!/^re_[A-Za-z0-9_\-]+$/.test(apiKey) || !/^[^\r\n<>]+ <[^\s@<>]+@[^\s@<>]+>$/.test(from)) {
    throw new Error("Invalid deletion email server configuration.");
  }
  return { apiKey, from };
}

export async function sendDeletionVerificationEmail(
  config: DeletionEmailConfig,
  recipient: string,
  code: string,
  fetchImpl: typeof fetch = fetch,
) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) || /[\r\n]/.test(recipient)) {
    throw new Error("Invalid verification recipient.");
  }
  if (!/^\d{8}$/.test(code)) {
    throw new Error("Invalid deletion verification code.");
  }

  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [recipient],
      subject: "Confirm your Cosmic Dossier account deletion request",
      text:
        `Your account deletion verification code is ${code}.\n\n` +
        "It expires in 10 minutes. If you did not request account deletion, ignore this email. " +
        "This code alone does not delete your account.",
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Could not send the account deletion verification email.");
  }
  return { sent: true };
}
