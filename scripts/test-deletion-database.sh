#!/usr/bin/env bash
set -euo pipefail

# Explicitly isolated PostgreSQL/Supabase instance only.
# Example: TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres bash scripts/test-deletion-database.sh
if [[ -z "${TEST_DATABASE_URL:-}" ]]; then
  echo "TEST_DATABASE_URL is required (local isolated database only)." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to run the database tests." >&2
  exit 1
fi

# Only loopback hosts are permitted. This intentionally rejects hosted Supabase.
db_host="$(psql "$TEST_DATABASE_URL" -X -Atqc 'select inet_server_addr()::text' 2>/dev/null)" || {
  echo "Unable to connect to test database." >&2
  exit 1
}
case "$db_host" in
  127.0.0.1|::1) ;;
  *) echo "Refusing non-loopback database host: $db_host" >&2; exit 1 ;;
esac

# Confirm that the target is a local Supabase stack with expected auth schema.
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc \
  "select case when to_regclass('auth.users') is not null then 'ready' else 1/0::text end" >/dev/null

echo "Applying staged deletion migrations to loopback test database..."
for file in \
  supabase/migrations/20261124000000_account_deletion_challenge_storage.sql \
  supabase/migrations/20261124000001_atomic_deletion_challenge_consume.sql \
  supabase/migrations/20261124000002_atomic_deletion_authorization_consume.sql; do
  psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$file"
done

echo "Checking database security..."
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -f supabase/tests/account_deletion_security.sql
echo "Database security assertions passed."
