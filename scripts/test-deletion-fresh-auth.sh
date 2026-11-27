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
print(test.replace("-- FRESH_AUTH_REVIEW_DRAFT", core))
PY
