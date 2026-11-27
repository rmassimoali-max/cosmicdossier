# Permanent account deletion coordinator: design checkpoint

Status: proposal only. No destructive implementation or activation authorized.

## Verified development inventory (2026-11-27)

Read-only inspection of cosmicdev (umcpchdifhxhxvhnatxo) confirmed RLS enabled on public.saved_assessments, public.account_deletion_challenges, public.account_deletion_authorizations and private.deletion_session_authorizations. The first three reference auth.users(id) with ON DELETE CASCADE. The private session table has no foreign key to the account. Storage bucket count, object count and session authorization row count were all zero at inspection time. Production parity is unverified.

Source review confirms one-time Stripe payment mode, no explicit Supabase user ID association in checkout creation, browser-local bearer receipt and browser-local dossier. Do not infer ownership of Stripe records from email matching.

## Proposed policy requiring owner approval

Delete account identity and account-owned cloud assessments. Invalidate outstanding proofs and sessions. Retain payment records subject to applicable obligations; do not automatically refund or revoke a paid browser receipt. Offer separate explicit local dossier removal. Explain that other devices, downloaded PDFs and backups cannot be immediately erased by this operation.

## Coordinator contract

- Require trusted fresh identity, independently reviewed fresh reauthentication, explicit confirmation and session-scoped email authorization. Never accept a target user ID or raw authorization credentials from the browser.
- Atomically consume authorization and create a durable, uniquely keyed deletion intent before any irreversible operation. Existing consumption helper alone is insufficient: a crash between consumption and intent creation would lose the proof.
- Serialize intents per account; prevent concurrent sign-ins and account-owned writes during deletion using an independently reviewed enforcement mechanism. Do not assume revoking refresh tokens invalidates existing JWTs.
- Use a separate least-privilege privileged execution boundary; do not expand the existing verification worker to delete auth.users.
- Reconcile provider outcomes after timeouts before retrying. Auth deletion and external calls cannot be assumed to share a PostgreSQL transaction.
- Verify absence of account and dependent rows before reporting completion. Retain only minimal, time-bounded operational evidence; design intent persistence so it survives account deletion without retaining unnecessary personal data.
- Private session proof slots lack account ownership metadata. Design explicit invalidation or bounded expiry and verified cleanup; do not claim cascade coverage. Underlying account-bound authorizations disappear on Auth deletion.
- Clear cookies only with accurate outcome messaging; support safe recovery when account deletion succeeds but the response is lost.

## Acceptance gates

Test with dedicated disposable accounts only after explicit approval: concurrent requests, expired and replayed proofs, wrong session/account, reauthentication failure, provider timeout before and after deletion, retry after crash, concurrent writes and sign-ins, stale JWTs, cascade verification, unrelated account preservation, cleanup and accurate UI. Verify schema parity and storage inventory separately before production activation. No production migration, Stripe mutation or destructive endpoint is authorized by this document.
