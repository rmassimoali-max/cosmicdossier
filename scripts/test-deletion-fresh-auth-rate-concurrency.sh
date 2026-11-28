#!/usr/bin/env bash
set -euo pipefail
[[ "${TEST_DATABASE_URL:-}" == "postgresql://postgres:postgres@127.0.0.1:5432/postgres" && "${GITHUB_ACTIONS:-}" == "true" ]] || { echo "Disposable GitHub CI database required"; exit 1; }
tmp=$(mktemp -d)
sql() { psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c "$1"; }
cleanup() {
  sql "drop function if exists private.reserve_deletion_fresh_auth_attempt(uuid); drop table if exists private.deletion_fresh_auth_attempts; drop owned by deletion_fresh_auth_rate_ci; drop role if exists deletion_fresh_auth_rate_ci;" >/dev/null
  rm -rf "$tmp"
}
python3 - <<'PY' | psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1
from pathlib import Path
draft = Path("docs/sql/deletion-fresh-auth-rate-review.sql").read_text()
print(draft.split("-- Owner-only synthetic tests.", 1)[0])
print("""
create role deletion_fresh_auth_rate_ci nologin noinherit;
grant usage on schema private to deletion_fresh_auth_rate_ci;
grant select, insert on private.deletion_fresh_auth_attempts to deletion_fresh_auth_rate_ci;
create policy rate_access on private.deletion_fresh_auth_attempts to deletion_fresh_auth_rate_ci using (true) with check (true);
grant execute on function private.reserve_deletion_fresh_auth_attempt(uuid) to deletion_fresh_auth_rate_ci;
commit;
""")
PY
trap cleanup EXIT
for i in 1 2 3 4; do
  sql "begin isolation level read committed; set local role deletion_fresh_auth_rate_ci; select private.reserve_deletion_fresh_auth_attempt('33333333-3333-4333-8333-333333333333'); select pg_sleep(1); commit;" > "$tmp/$i" &
  pids[$i]=$!
done
for i in 1 2 3 4; do wait "${pids[$i]}"; done
[[ $(grep -hxc 't' "$tmp/"* | awk '{s+=$1} END {print s}') == 1 ]]
[[ $(grep -hxc 'f' "$tmp/"* | awk '{s+=$1} END {print s}') == 3 ]]
[[ $(sql "select count(*) from private.deletion_fresh_auth_attempts;") == 1 ]]
echo "PASS: four concurrent reservations yield exactly one success"
