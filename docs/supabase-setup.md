# Cosmic Dossier: Supabase authentication setup

This document is for the first stage of account infrastructure. **This PR does not enable sign-in or change checkout.**

## Supabase dashboard

1. Create a Supabase project named `cosmicdossier` in an appropriate region.
2. In Authentication, ensure the Email provider is enabled. We plan to use passwordless magic links.
3. In Authentication > URL Configuration, set **Site URL** to `https://www.cosmicdossier.com`.
4. Add `https://www.cosmicdossier.com/auth/callback` to **Redirect URLs**. This is a planned route; it will not work until implemented in the follow-up authentication UI PR.
5. For local testing, add `http://localhost:8080/auth/callback` as an additional redirect URL only if using the local dev server on that port.
6. Before sending production emails, configure a verified SMTP sender, review Supabase email rate limits, and customize the email template for the PKCE callback flow.
7. Under Project Settings > API Keys, locate the public project URL and publishable key.

## Vercel environment variables

Set these in the appropriate Vercel environment (Preview first):

- `SUPABASE_URL`: Supabase project HTTPS URL
- `SUPABASE_PUBLISHABLE_KEY`: public publishable key

Do not set `VITE_` prefixes until the browser authentication architecture is implemented and reviewed. Never expose a `service_role` key, secret API key, JWT signing secret, or database password in client code. Do not paste secrets into GitHub or chat.

## Architecture guardrails

- The existing $4 Stripe checkout remains unchanged until account-linked entitlements are implemented and tested.
- A Supabase account alone does not grant paid access.
- Server code must verify a user session before reading or writing their private records.
- Saved profiles will require owner-scoped row-level security (RLS), with policies and tests before launch.
- Purchases must be recorded from verified Stripe webhook events, not a browser-supplied paid flag.
- Existing browser-only purchase receipts need an explicit migration/recovery plan.
- No personal dossier should be sent to analytics or stored without clear user action and privacy notice.

## Next PR

Implement secure email magic-link request, callback exchange, HTTP-only server session management, sign-out, and authenticated account UI. Validate the auth flow in Preview before enabling it in Production.
