# Password recovery security rollout (testing branch)

The password-reset route now **only** accepts a Supabase recovery-specific one-time token hash. Ordinary access/refresh tokens, even when valid for login, cannot establish password-reset permission. Supabase verifies the token with `type: "recovery"` before the server sets the short-lived HttpOnly recovery cookie. Normal session creation clears any previous recovery permission.

## Required Supabase recovery email template

The default `{{ .ConfirmationURL }}` link redirects with an ordinary session fragment and is **intentionally rejected** by the hardened route. Before end-to-end testing, update **Supabase Dashboard → Authentication → Email Templates → Reset Password** (recovery) to link directly to the allowed redirect destination with a one-time recovery hash:

```html
<a href="{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type=recovery">Reset your password</a>
```

Use the existing recovery email's styling and replace only its reset link. The fragment prevents the token hash from being included in the HTTP request URL sent to the application server; the browser immediately clears the fragment before calling the verification server function. Do **not** use `{{ .SiteURL }}` for the reset link, since that ignores the request's localhost/preview redirect. Confirm `http://localhost:8080/reset-password` and the intended preview/production URLs are allowlisted in Supabase URL Configuration. Template changes apply to the shared Supabase project, so coordinate with the preview test; production's existing password-recovery flow may be affected by a template change before deployment.

## Validation checklist

1. Pull the testing branch; run `bun run build`, `bunx tsc --noEmit`, `bunx eslint .`, and `bun test`.
2. An ordinary sign-in session fragment `#access_token=...&refresh_token=...&type=recovery` must **not** open the password-update form.
3. An invalid `#token_hash=not-valid&type=recovery` must **not** open the form.
4. A fresh recovery email using the custom template must open the local reset form after server verification, update the password, and allow sign-in with the new password.
5. Confirm no tokens, passwords, or full recovery URLs appear in application logs; revoke previously exposed sessions.
6. Keep PR #12 unmerged until the above and production configuration checks pass.
