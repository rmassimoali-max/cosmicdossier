# Fresh-authentication database review

Status: design review only. No SQL from the accompanying review draft has been executed.

## CI status

Commit `bfdec70` passed CI, deletion database security workflow, and PostgreSQL dependency lockfile workflow. These workflows do not execute the rollback-only SQL draft or prove its runtime ACLs and concurrency behavior.

## Important permission boundary

The draft functions are SECURITY INVOKER and have no runtime EXECUTE grants. Keep them that way until a dedicated database role and complete ACL matrix are reviewed. Do not grant these functions to authenticated, anon, PUBLIC, or the existing deletion verification worker.

The issue function accepts user_id and original_session_id parameters. A future trusted server adapter must derive these only after verifying the provider token and session_id against trusted Supabase Auth state. Never accept them directly from browser input. The database must enforce that the flow hash and browser hash are well-formed; secrets are generated with high entropy and domain-separated HMACs server-side.

A narrowly scoped runtime role needs only the minimum schema USAGE, table INSERT/DELETE/SELECT required by its operations, and EXECUTE on the exact functions. The cleanup operation should be separately privileged from issuance/consumption if operationally feasible. Verify default privileges and inherited grants, not just direct grants. Keep RLS enabled as defense in depth; do not use SECURITY DEFINER to bypass it.

## Required disposable-Postgres tests before any grants

1. Function owner and runtime role effective privileges; anon/authenticated/PUBLIC denied.
2. Runtime role cannot read the table directly, change user IDs, update or truncate rows, access unrelated tables, or invoke cleanup unless explicitly authorized.
3. Insert rejects malformed hashes, invalid UUIDs and duplicate flow IDs; issuance rate limits enforced in trusted server layer.
4. Correct browser hash consumes exactly one row; wrong browser leaves row untouched; expired flow cannot be consumed.
5. Two concurrent take calls using separate connections yield exactly one row total.
6. Account deletion cascades only that user's flow; unrelated user's flow remains.
7. Cleanup removes no more than 500 expired rows, skips concurrently locked rows safely, and never removes unexpired flows.
8. Search path is empty and object references are schema-qualified; function owner and ACLs are inspected.
9. Failures are closed: storage errors never produce a fresh-authentication approval.

Only after this should a migration and a narrowly scoped adapter be considered. CI success is not SQL execution evidence. No development or production database change is authorized by this review.

## Development database read-only verification (2026-11-27)

The rollback-only SQL draft remains unapplied. A read-only catalog query against cosmicdev project `umcpchdifhxhxvhnatxo` returned no functions in schema `private` with names matching `%fresh_auth%`. A second read-only query confirmed `anon`, `authenticated`, and `PUBLIC` do not have USAGE on schema `private`; all three have USAGE on schema `public`. This is consistent with keeping the proposed fresh-authentication functions inaccessible until a restricted role is deliberately designed. It does not prove the future functions' effective ACLs, nor does it audit every role, default privilege, inherited membership, or production project.

The PR head at this checkpoint is `ae4d664`; all three workflows passed: CI, deletion database security, and PostgreSQL dependency lockfile. These checks validate repository workflows, not execution of the rollback-only SQL. PR #16 remains open and draft. No schema changes were applied.

## Effective role and function audit (2026-11-27)

Read-only catalog inspection of cosmicdev confirms:

- `deletion_backend`: NOLOGIN, NOINHERIT, not superuser, no CREATEROLE/CREATEDB/BYPASSRLS.
- `deletion_worker`: LOGIN, NOINHERIT, not superuser, no CREATEROLE/CREATEDB/BYPASSRLS.
- `deletion_worker` is a member of `deletion_backend` (admin_option false). NOINHERIT prevents automatic privilege inheritance but does not by itself prevent SET ROLE to a granted role. Therefore the worker must be treated as able to assume backend privileges unless a live SET ROLE denial test or membership redesign proves otherwise. Previous direct-table-privilege matrix alone understated effective capability.
- Existing private deletion functions inspected are SECURITY INVOKER, have empty search_path, and grant EXECUTE to deletion_backend; anon and authenticated cannot execute them. The worker has no direct EXECUTE but membership in backend means effective role switching must be considered.
- Backend has read/insert/update/delete on private.deletion_session_authorizations; read/insert/update on public account_deletion_authorizations and account_deletion_challenges; no direct privileges on auth.users, auth.sessions, or saved_assessments.

This is a significant least-privilege boundary finding. Do not grant fresh-auth functions or any deletion executor capability to the current backend role until the worker/backend membership model is redesigned and tested. Do not remove membership or alter role settings as part of this audit without explicit change review. Column-level grants, default ACLs and all role memberships remain to be fully inventoried; one attempted default-ACL query was invalid and yielded no evidence.
