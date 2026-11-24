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

# Competing exchanges of one challenge must create only one authorization.
challenge_hash=$(printf '6%.0s' {1..64})
first_hash=$(printf '7%.0s' {1..64})
second_hash=$(printf '8%.0s' {1..64})
challenge_id=$(psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAtc \
  "insert into public.account_deletion_challenges(user_id,token_hash,expires_at) values ('$user_id','$challenge_hash',now()+interval '10 minutes') returning id")
: >"$first"
: >"$second"
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAt <<SQL >"$first" &
begin;
select private.exchange_account_deletion_challenge('$challenge_id','$user_id','$challenge_hash','$first_hash');
select pg_sleep(3);
commit;
SQL
first_pid=$!
sleep 1
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAtc \
  "select private.exchange_account_deletion_challenge('$challenge_id','$user_id','$challenge_hash','$second_hash')" >"$second" &
second_pid=$!
wait "$first_pid"
wait "$second_pid"
issued_count=$(psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -qAtc \
  "select count(*) from public.account_deletion_authorizations where user_id='$user_id' and authorization_hash in ('$first_hash','$second_hash')")
if [[ "$(grep -Ec '^[0-9a-f-]{36}$' "$first")" != 1 || -n "$(tr -d '[:space:]' < "$second")" || "$issued_count" != 1 ]]; then
  echo "Concurrent challenge exchange failed single-issuance assertion" >&2
  cat "$first" "$second" >&2
  exit 1
fi
echo "PASS: concurrent challenge exchanges issue exactly one authorization"
