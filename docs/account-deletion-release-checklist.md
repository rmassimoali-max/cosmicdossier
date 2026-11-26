# Account deletion: staged security and release checklist

**Status: NOT ENABLED.** This branch contains verification primitives and tests, not a production account-deletion service. Do not merge or apply staged migrations to the shared production Supabase database solely because CI passes.

## What is staged

- Eight-digit email codes, generated server-side and stored as user/challenge-bound HMAC digests.
- A provider-acceptance gate: a pending challenge cannot be verified until email delivery has been accepted and activation recorded.
- One challenge per user at a time, issuance throttling, a ten-minute challenge window, and five failed verification attempts.
- Atomic challenge exchange into a five-minute, single-use authorization, plus authorization consumption.
- A restricted NOLOGIN database role, RLS and SQL security tests, and concurrent-consumption tests in disposable PostgreSQL.
- Fail-closed backend configuration. No browser endpoint is wired to request, exchange, consume, or delete.

## Release blockers: must be completed and independently reviewed

- [ ] Decide and document account-deletion semantics, including Stripe subscription handling, refunds, stored dossiers, backups, audit logs, and retention obligations. Deleting Auth alone is not complete account deletion.
- [ ] Provision a **separate** database credential for the privileged backend. Review role membership, RLS, and every granted function/table permission. Never expose privileged credentials or HMAC secrets to the client, logs, or build artifacts.
- [ ] Verify preview and production isolation. This project's preview and production may point to the same Supabase project: never execute staged migrations against it during preview testing.
- [ ] Set up verified Resend sender identity and server-only environment secrets. Confirm delivery, provider failure, timeouts, and replay behavior with an isolated staging database.
- [ ] Implement a server-only PostgreSQL connection with verified TLS and bounded connection/timeouts. Test against the actual runtime and driver before deployment.
- [ ] Build an authenticated server endpoint for requesting a challenge. Derive user ID and verified email exclusively from a fresh trusted session, enforce origin/CSRF protections, and apply request throttling before sending.
- [ ] Build a server-only verification endpoint. Derive user identity from the session; bind challenge ID to that user; never return the authorization secret to the browser or place it in URLs, analytics, or logs. Store any pending authorization only in protected server-side state.
- [ ] Require fresh reauthentication and explicit deletion confirmation **in addition** to the email challenge. A successful email challenge by itself must not authorize destruction.
- [ ] Design a separate, transactional, idempotent deletion coordinator for all user-owned data, Stripe state, and Supabase Auth. Review ordering, retries, partial failures, race conditions, and cancellation/retention policy. This coordinator does not exist yet.
- [ ] Revoke sessions and handle concurrent sign-ins, outstanding challenges, and pending authorization state as part of the final design.
- [ ] Test end-to-end in a genuinely isolated environment: two users, wrong-account attempts, resend, lockout, expiry, concurrency, email provider outages, database outages, and partial-deletion recovery.
- [ ] Obtain a security review of RLS, least privilege, rate limits, audit trail, CSRF/origin defenses, and abuse cases before enabling any destructive endpoint.
- [ ] Review the final user-facing copy, including exactly what will be deleted, what is retained, timing, and irreversibility. Keep the final action disabled until the full release checklist is signed off.

## Operational rules

1. Keep PR #14 as a draft until reviewed. A green Vercel check proves a deployment built, **not** that staged SQL was safely applied or deletion is ready.
2. Run SQL migrations and SQL tests only in the disposable CI database or an explicitly isolated staging Supabase project.
3. Never use a service-role key or unrestricted database URL in browser code.
4. Never log or return email codes, raw authorization tokens, HMAC secrets, or connection strings.
5. A successful authorization consumption does **not** delete an account and must not be presented as a completed deletion.
6. Require explicit approval before applying migrations or enabling the production deletion endpoint.
