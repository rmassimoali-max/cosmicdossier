# Account deletion: security implementation checkpoint

Status: planning and review only. No deletion endpoint enabled, no Supabase schema changes, no Stripe mutations.

## Existing code and constraints
- `src/routes/account.tsx` has an informational deletion review panel with a permanently disabled action.
- `src/lib/auth.functions.ts` stores HttpOnly access/refresh cookies and supports password and email-link sign-in.
- `public.saved_assessments.user_id` is documented as an `ON DELETE CASCADE` foreign key; independently verify live constraints before activation.
- Production and preview share a Supabase project. Never run destructive preview tests against real users.
- PR #14 also contains saved-assessment groundwork; do not merge or execute review-only SQL as part of this deletion checkpoint.

## Proposed safe deletion flow
1. User initiates deletion while signed in. Server resolves account identity from verified Supabase Auth session, never from client-supplied user ID.
2. Require a fresh, single-use reauthentication proof bound to the same account and deletion intent. Support both password users and passwordless users; a mere typed DELETE or existing cookie is insufficient.
3. Show a final summary of what is deleted, what remains (e.g. payment records legally retained), and browser-local data that is not automatically deleted across devices.
4. Server checks proof freshness, account binding, one-time use, CSRF/origin defenses, and rate limits; reject stale/replayed/concurrent requests.
5. Run privileged admin deletion only on server with server-only secret; never expose key to browser, logs, PR, or public env vars. Do not accept target user ID from request.
6. Confirm all account-owned database rows and storage dependencies. Validate cascade behavior, audit any tables without cascades, and handle partial failures. Never claim completion until provider confirms.
7. Handle sessions: deletion does not instantly invalidate previously issued JWTs. Revoke refresh sessions and assess short-lived token and authorization checks for sensitive endpoints; clear local cookies on confirmed success.
8. Stripe: do not delete or refund charges automatically. Determine whether Stripe customer references or metadata need redaction while retaining required transaction records; document policy and applicable obligations before enabling.
9. Keep an audit record with minimal non-sensitive fields (request ID, timestamps, outcome), no access tokens or unnecessary personal data.

## Required tests before enabling
- Missing, expired, wrong-account, reused and concurrent proofs are rejected.
- Forged user ID cannot target another account.
- Password and passwordless reauthentication both work.
- No secret is present in browser bundle or returned responses.
- A deliberately created test account is deleted; associated saved assessments cascade; unrelated accounts remain intact.
- Stripe payment/receipt history is retained according to reviewed policy, with no unintended refunds.
- Existing access/refresh token behavior is explicitly tested after deletion.
- Simulated Supabase/Stripe failures produce safe, accurate UI state.
- Account UI works signed out and signed in, including cancel and confirmation.
- CI (format, TypeScript, lint, tests, build) passes before review.

## Activation gate
Do not implement or enable privileged deletion until owner approves the verified data-retention policy, secret deployment plan, and dedicated test-account deletion. Keep the final button disabled in preview and production until all tests pass.
