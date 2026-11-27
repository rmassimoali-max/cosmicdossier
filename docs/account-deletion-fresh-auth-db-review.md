# Fresh-authentication database review

Status: design review and disposable CI prototype only. No production or development migration has been applied.

## CI prototype

The disposable PostgreSQL CI test creates a temporary NOLOGIN role with only SELECT, INSERT and DELETE on a dedicated private flow table, plus EXECUTE on a SECURITY INVOKER consume function. It asserts no UPDATE/TRUNCATE, no auth.users DELETE, and no anon/authenticated function execution. It tests wrong-browser rejection, correct-browser single-use consumption, replay rejection and preservation of an unrelated account's flow. All objects and test data are wrapped in a transaction and rolled back.

This prototype deliberately demonstrates the actual privilege tradeoff: a compromised fresh-auth database credential can directly read, insert and delete rows in its own dedicated flow table. SECURITY INVOKER does not hide that table behind the function. It has no access to account deletion tables or auth.users deletion.

## Role separation

Keep the existing verification worker/backend pair unchanged. Fresh authentication uses an independent role with no membership path to the existing pair. The permanent deletion executor remains a separate future capability and is not implemented.

## Remaining gates

- Add two-connection concurrency test for the fresh-auth consume function.
- Add expired-flow and cleanup tests.
- Verify HMAC generation, provider token/session verification, browser binding and rate limits in trusted server code.
- Review actual default ACLs and effective role memberships before any live grants.
- Keep production schema parity and destructive deletion testing as separate approval gates.

CI success validates the disposable fixture only. No live schema changes or production activation are authorized.
