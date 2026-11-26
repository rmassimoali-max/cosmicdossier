# Dedicated account-deletion challenge: implementation contract

Status: design-only, NOT deployed or authorized for destructive operations.

## Why not use Supabase reauthentication nonce?
Supabase `reauthenticate()` sends a nonce for sensitive user updates (notably password changes). Its documented verification is via `updateUser({nonce, password,...})`. Do not treat receipt, entry, or an arbitrary `verifyOtp` call as proof authorizing deletion. A deletion-specific proof must be verified independently.

## Proposed implementation
- Use a server-owned challenge store with random 256-bit challenge ID and hashed random token, bound to authenticated Supabase user UUID, purpose `account_deletion`, creation time, 10-minute expiry, attempt counter, consumed timestamp, and request origin.
- Deliver the challenge to the account's verified email using a transactional email provider, with a purpose-specific message. Do not put credentials or a privileged key in the browser, URL logs, or analytics.
- User enters the challenge token in the account page; a POST server function validates the signed-in session using Supabase Auth `/user`, the token hash, account binding, purpose, expiry, and retry limit. Consume atomically with a transaction, and issue a separate opaque, HttpOnly, Secure, SameSite authorization cookie valid for at most 5 minutes. Store only a hash of that authorization server-side and bind to the same user.
- A future deletion POST requires that authorization plus a fresh session, CSRF/origin verification, rate limits, and an atomic consume operation. Derive target user ID only from the authenticated server session. Do not accept an arbitrary target user ID.
- Ensure authorization cannot be replayed across accounts or browsers. If deletion fails, do not report success. Provide idempotent retry/recovery semantics.
- Privileged Supabase admin deletion must remain server-only and disabled until Stripe retention, storage ownership, cascade behavior, and JWT/session revocation are reviewed.
- Preview and production currently share the same Supabase project. Use isolated test identities and do not test real deletion against a live account.

## Before implementation
1. Choose a transactional email provider or a verified purpose-specific Supabase Auth email flow that can be securely validated without changing passwords or sessions.
2. Add migrations for challenge records with RLS and no client write permissions; define expiry cleanup.
3. Add automated tests for wrong account, wrong token, expired token, replay, concurrency, rate limiting, and CSRF.
4. Validate both password and passwordless sign-in paths. Do not mistake a password verification response for deletion authorization.
5. Keep the permanent deletion action disabled until end-to-end tests and owner approval.

Reference: https://supabase.com/docs/reference/javascript/auth-reauthenticate
