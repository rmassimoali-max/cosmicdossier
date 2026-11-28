#!/usr/bin/env bash
set -euo pipefail
[[ "${TEST_DATABASE_URL:-}" == "postgresql://postgres:postgres@127.0.0.1:5432/postgres" ]] || { echo "Disposable CI database required"; exit 1; }
python3 - <<'PY' | psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1
from pathlib import Path
draft = Path("docs/sql/deletion-fresh-auth-storage-review.sql").read_text()
test = Path("supabase/tests/deletion_fresh_auth_storage.sql").read_text()
assert draft.count("\nbegin;\n") == 1 and draft.rstrip().endswith("\nrollback;")
assert test.count("-- FRESH_AUTH_REVIEW_DRAFT") == 1
core = draft.split("\nbegin;\n", 1)[1].rsplit("\nrollback;", 1)[0]
import re
source = Path("src/lib/deletion-fresh-auth-sql.server.ts").read_text()
matches = re.findall(r'"(select current_user = .* as allowed)"', source)
assert len(matches) == 1
query = matches[0].removesuffix(" as allowed")
fixture = """
create role deletion_fresh_auth_worker login noinherit;
create role deletion_fresh_auth_backend nologin noinherit;
grant deletion_fresh_auth_backend to deletion_fresh_auth_worker;
grant usage on schema private to deletion_fresh_auth_backend;
grant select, insert, delete on private.deletion_fresh_auth_flows to deletion_fresh_auth_backend;
grant execute on function private.issue_deletion_fresh_auth_flow(text,text,uuid,uuid) to deletion_fresh_auth_backend;
grant execute on function private.take_deletion_fresh_auth_flow(text,text) to deletion_fresh_auth_backend;
create policy fresh_auth_connection_ci on private.deletion_fresh_auth_flows
  to deletion_fresh_auth_backend using (true) with check (true);
"""
def check(expected):
    return """
set session authorization deletion_fresh_auth_worker;
set local role deletion_fresh_auth_backend;
do $check$
begin
  if (""" + query + """) is distinct from """ + expected + """ then
    raise exception 'Fresh-auth connection privilege check mismatch';
  end if;
end;
$check$;
reset role;
reset session authorization;
""".replace(" as allowed)", ")")
# Remove the result alias when embedding the exact query as a scalar subquery.
checks = fixture + check("true")
checks += "grant update(flow_hash) on private.deletion_fresh_auth_flows to deletion_fresh_auth_backend;\n"
checks += check("false")
checks += "revoke update(flow_hash) on private.deletion_fresh_auth_flows from deletion_fresh_auth_backend;\n"
checks += "grant deletion_backend to deletion_fresh_auth_worker;\n"
checks += check("false")
checks += "revoke deletion_backend from deletion_fresh_auth_worker;\n"
checks += check("true")
checks += "grant select on auth.users to deletion_fresh_auth_worker;\n"
checks += check("false")
checks += "revoke select on auth.users from deletion_fresh_auth_worker;\n"
checks += "grant execute on function private.cleanup_deletion_fresh_auth_flows() to deletion_fresh_auth_backend;\n"
checks += check("false")
checks += "revoke execute on function private.cleanup_deletion_fresh_auth_flows() from deletion_fresh_auth_backend;\n"
checks += "alter table private.deletion_fresh_auth_flows disable row level security;\n"
checks += check("false")
checks += "alter table private.deletion_fresh_auth_flows enable row level security;\n"
checks += check("true")
checks += "select 'PASS: fresh-auth connection privilege checks' as result;\n"
print(test.replace("-- FRESH_AUTH_REVIEW_DRAFT", core + "\n" + checks))
PY
