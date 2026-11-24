# Account deletion verification: integration readiness review

Status: BLOCKED, no live migrations applied and no deletion endpoint enabled.

## Confirmed building blocks
- A cryptographically random token generator and pure challenge checks are committed.
- The staged database schema includes challenge and authorization records, expiry fields, attempt counters, and consumed timestamps.
- Staged SQL functions serialize challenge attempts and atomically consume authorization records.
- Existing UI password verification is informational only. The eight-digit Supabase reauthentication nonce is for password changes, not this flow.

## Integration blockers identified in review

1. **Database access mismatch.** The SQL functions are in `private` and executable only by `postgres`. Supabase's ordinary service-role REST client cannot automatically call functions in a non-exposed schema or impersonate `postgres`. A privileged, server-only database connection or carefully scoped alternative must be designed and tested before wiring application code. Do NOT expose the private schema through PostgREST or grant its functions to `authenticated` merely to make calls work.
2. **Challenge delivery is not implemented.** Select and configure a transactional email provider, verify domain ownership and sender identity, then implement purpose-specific messages and delivery throttling. Do not repurpose the password-change nonce.
3. **Issuance and consumption are not one transaction yet.** Successful challenge consumption must issue the short-lived authorization atomically, or safely handle failure without leaving a reusable authorization path. Only the hashed authorization token should be persisted.
4. **Session and browser binding.** Fresh server-side Supabase `/user` verification, origin/CSRF checks, cookie attributes, account/session binding, and revocation behavior remain to be implemented and tested.
5. **Destructive operation is not designed end-to-end.** Confirm Stripe records and legal retention, application data ownership and cascading behavior, pending subscriptions, storage, and active JWT invalidation. Supabase Auth deletion alone does not immediately invalidate already-issued access tokens.
6. **Integration tests are missing.** Test against an isolated Supabase environment: failed-attempt increments, wrong account, expiry, replay, concurrent requests, role grants, RLS, delivery failures, and end-to-end session handling. Green GitHub CI does not prove these database functions have been executed.

## Next safe milestone
- Decide the server-to-database access method and email provider.
- Add an isolated integration test harness and deploy staged migrations to a nonproduction Supabase project only.
- Keep the delete button disabled until security tests and an explicit activation review pass.

No production migrations, secrets, emails, or account deletions are performed by this document.
