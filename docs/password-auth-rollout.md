# Email/password account pivot

This PR replaces the user-facing magic-link form with email/password registration and sign-in using Supabase Auth. It adds an **optional** account prompt before the existing Stripe embedded checkout.

## Supabase dashboard

- Under Authentication > Sign In / Providers > Email, keep Email enabled.
- Keep **Confirm email** enabled. Supabase sends the standard signup confirmation email. Its confirmation link returns to `/sign-in` so the user can sign in with their password afterward. Add `https://www.cosmicdossier.com/sign-in` to allowed Redirect URLs.
- Configure a verified custom SMTP sender and password-recovery flow before inviting real customers. The default Supabase email service is rate-limited and is not production-ready for broad public signups.
- Vercel Production must have `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `AUTH_SITE_URL=https://www.cosmicdossier.com`.

## Test plan

1. Create an account, receive the signup confirmation email, confirm, and sign in with the password.
2. Refresh `/account` and verify the session persists. Sign out and verify it no longer shows the email.
3. Enter a dossier, click unlock, choose **Continue to $4 checkout**, and complete a Stripe test payment. Check PDF export.
4. Repeat with a declined Stripe test card and verify no unlock.
5. Verify account creation is optional and free tests still work without login.

## Not implemented here

- Saved profiles or dossiers
- Account-linked Stripe entitlements or cross-device purchase recovery
- Password reset (must be added and tested before production launch)
- Server-side premium dossier generation

**Do not advertise accounts as purchase protection until the entitlement system is implemented.** Existing checkout behavior remains guest-based, including after account creation.
