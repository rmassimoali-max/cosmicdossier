# Cosmic Dossier: Supabase magic-link setup

## Dashboard (owner action)

1. Enable **Authentication > Sign In / Providers > Email**.
2. Under **Authentication > URL Configuration**, set Site URL to `https://www.cosmicdossier.com` and allow redirect URL `https://www.cosmicdossier.com/auth/callback`.
3. For Preview testing, add the **exact** Vercel Preview deployment origin followed by `/auth/callback`. Do not use a wildcard covering arbitrary hosts.
4. Under **Authentication > Email Templates > Magic Link**, change the clickable link to:
   `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink`
   Use an HTML anchor with this URL as its href. The default `{{ .ConfirmationURL }}` link does not deliver the token hash to our application callback.
5. Review sender settings, email delivery rate limits, and configure verified custom SMTP before production traffic.

## Vercel environment variables

Set **Preview** first, then Production after testing:

- `SUPABASE_URL`: the project HTTPS URL
- `SUPABASE_PUBLISHABLE_KEY`: the public publishable key
- `AUTH_SITE_URL`: the **exact Preview origin** (for example `https://your-preview.vercel.app`), or `https://www.cosmicdossier.com` in Production

Redeploy after setting variables. Never commit or send secret API keys, service-role credentials, or database passwords.

## Flow

- `/sign-in` sends a server-side OTP request with the configured redirect URL.
- The magic-link email opens `/auth/callback?token_hash=...&type=magiclink`.
- The callback immediately removes the token hash from browser history, verifies it server-side, and stores access and refresh tokens in HTTP-only SameSite=Lax cookies.
- `/account` checks the session server-side and offers sign-out. Refresh tokens are used when the access cookie expires.
- Existing Stripe payment verification is unchanged. Signing in does not confer a paid entitlement.
- Saved dossiers, row-level security, account-linked purchases, and existing purchase recovery are **not implemented** in this PR.

## Verification before merge

- CI: TypeScript, ESLint/Prettier, Bun tests, production build.
- Preview: magic-link email, callback, account page, refresh after access-token expiry, sign-out, expired/reused link, and failed email delivery.
- Test Stripe successful/declined payment and PDF export again to ensure no regression.
- Validate HTTPS, cookie flags, account access controls, and redirect allowlist.

**Caution:** The free tier's default email sending is rate-limited. Use custom SMTP before public launch.
