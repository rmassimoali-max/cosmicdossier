#!/usr/bin/env bash
set -euo pipefail

# Called only after the disposable PostgreSQL fixture and migrations are loaded.
# TEST_DATABASE_URL is validated by the parent test runner.
user_id='33333333-3333-4333-8333-333333333333'
hash=$(printf 'e%.0s' {1..64})
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAtc \
  "insert into auth.users(id) values ('$user_id')" >/dev/null
auth_id=$(psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAtc \
  "insert into public.account_deletion_authorizations(user_id,authorization_hash,expires_at) values ('$user_id','$hash',now()+interval '5 minutes') returning id")
first=$(mktemp)
second=$(mktemp)
cleanup() {
  rm -f "$first" "$second"
  psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAtc \
    "delete from auth.users where id='$user_id'" >/dev/null || true
}
trap cleanup EXIT

# First consumer keeps the row lock while the second consumer tries to update.
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAt <<SQL >"$first" &
begin;
select private.consume_account_deletion_authorization('$auth_id','$user_id','$hash');
select pg_sleep(3);
commit;
SQL
first_pid=$!
sleep 1
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAtc \
  "select private.consume_account_deletion_authorization('$auth_id','$user_id','$hash')" >"$second" &
second_pid=$!
wait "$first_pid"
wait "$second_pid"
if [[ "$(grep -xc 't' "$first")" != 1 || "$(grep -xc 'f' "$second")" != 1 ]]; then
  echo "Concurrent authorization consumption failed single-use assertion" >&2
  cat "$first" "$second" >&2
  exit 1
fi
echo "PASS: concurrent authorization requests yield exactly one success"
