import { z } from "zod";

const configSchema = z.object({
  url: z.string().url().refine((value) => new URL(value).protocol === "https:", {
    message: "Supabase URL must use HTTPS",
  }),
  publishableKey: z.string().min(1),
});

/**
 * Public Supabase project configuration only.
 * Never expose service-role keys, database passwords, or secret keys here.
 */
export function readSupabasePublicConfig(env: Record<string, string | undefined>) {
  const url = env["SUPABASE_URL"];
  const publishableKey = env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !publishableKey) return null;
  const result = configSchema.safeParse({ url, publishableKey });
  if (!result.success) throw new Error("Invalid Supabase public configuration");
  return result.data;
}

export function getAuthCallbackUrl(siteUrl: string) {
  const origin = new URL(siteUrl);
  if (origin.protocol !== "https:" && origin.hostname !== "localhost") {
    throw new Error("Authentication callback requires HTTPS outside localhost");
  }
  return new URL("/auth/callback", origin).toString();
}
