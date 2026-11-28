#!/usr/bin/env bash
set -euo pipefail
[[ "${TEST_DATABASE_URL:-}" == "postgresql://postgres:postgres@127.0.0.1:5432/postgres" && "${GITHUB_ACTIONS:-}" == "true" ]] || { echo "Disposable GitHub CI database required"; exit 1; }
tmp=$(mktemp -d)
sql() { psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c "$1"; }
cleanup() {
  sql "drop function if exists private.issue_deletion_fresh_auth_flow(text,text,uuid,uuid); drop function if exists private.take_deletion_fresh_auth_flow(text,text); drop function if exists private.cleanup_deletion_fresh_auth_flows(); drop table if exists private.deletion_fresh_auth_flows; delete from auth.users where id='33333333-3333-4333-8333-333333333333'; drop owned by deletion_fresh_auth_race_ci; drop role deletion_fresh_auth_race_ci;" >/dev/null
  rm -rf "$tmp"
}
python3 - <<'PY' | psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1
from pathlib import Path
draft = Path("docs/sql/deletion-fresh-auth-storage-review.sql").read_text()
assert draft.count("\nbegin;\n") == 1 and draft.rstrip().endswith("\nrollback;")
print("begin;")
print(draft.split("\nbegin;\n", 1)[1].rsplit("\nrollback;", 1)[0])
print("""
create role deletion_fresh_auth_race_ci nologin noinherit;
grant usage on schema private to deletion_fresh_auth_race_ci;
grant select, insert, delete on private.deletion_fresh_auth_flows to deletion_fresh_auth_race_ci;
create policy race_access on private.deletion_fresh_auth_flows to deletion_fresh_auth_race_ci using (true) with check (true);
grant execute on function private.issue_deletion_fresh_auth_flow(text,text,uuid,uuid), private.take_deletion_fresh_auth_flow(text,text) to deletion_fresh_auth_race_ci;
insert into auth.users(id) values ('33333333-3333-4333-8333-333333333333');
commit;
""")
PY
trap cleanup EXIT
sql "set role deletion_fresh_auth_race_ci; select private.issue_deletion_fresh_auth_flow(repeat('a',64),repeat('b',64),'33333333-3333-4333-8333-333333333333','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');" | grep -qx t
for i in 1 2 3 4; do
  sql "begin; set local role deletion_fresh_auth_race_ci; select count(*) from private.take_deletion_fresh_auth_flow(repeat('a',64),repeat('b',64)); select pg_sleep(1); commit;" > "$tmp/$i" &
  pids[$i]=$!
done
for i in 1 2 3 4; do wait "${pids[$i]}"; done
[[ $(grep -hxc '1' "$tmp/"* | awk '{s+=$1} END {print s}') == 1 ]]
[[ $(grep -hxc '0' "$tmp/"* | awk '{s+=$1} END {print s}') == 3 ]]
[[ $(sql "select count(*) from private.deletion_fresh_auth_flows;") == 0 ]]
echo "PASS: four independent fresh-auth consumers yield exactly one success"
