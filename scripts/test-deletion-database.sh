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

# Validate the requested connection endpoint, not inet_server_addr(): Docker's
# published localhost port reaches a container with a private bridge IP.
# Reject URL parameters (including hostaddr overrides) and remote hostnames.
if [[ ! "$TEST_DATABASE_URL" =~ ^postgres(ql)?://[^/?#@]+@((127\.0\.0\.1)|(\[::1\])):[0-9]+/[^/?#]+$ ]]; then
  echo "Refusing database URL: only explicit loopback TCP URLs without parameters are allowed." >&2
  exit 1
fi

# Confirm that the target is a local Supabase stack with expected auth schema.
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc \
  "select to_regclass('auth.users') is not null" | grep -qx 't'

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
echo "Checking single-use verification behavior..."
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f supabase/tests/account_deletion_behavior.sql
echo "Database security and behavior assertions passed."
