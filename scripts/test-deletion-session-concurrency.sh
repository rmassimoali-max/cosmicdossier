#!/usr/bin/env bash
set -euo pipefail
: "${TEST_DATABASE_URL:?Isolated test database required}"
if [[ ! "$TEST_DATABASE_URL" =~ ^postgres(ql)?://[^/?#@]+@((127\.0\.0\.1)|(\[::1\])):[0-9]+/[^/?#]+$ ]]; then
  echo "Refusing non-loopback database" >&2
  exit 1
fi
slot=$(printf '%064d' 987654321)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
sql() { psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atq -c "$1"; }
sql "set role deletion_backend; select private.put_deletion_session_authorization('$slot','concurrency-fixture',240000);" | grep -qx t
for i in 1 2 3 4; do
  sql "set role deletion_backend; select coalesce(private.take_deletion_session_authorization('$slot'),'EMPTY');" > "$tmp/$i" &
  pids[$i]=$!
done
for i in 1 2 3 4; do wait "${pids[$i]}"; done
[[ $(grep -hxc 'concurrency-fixture' "$tmp/"* | awk '{s+=$1} END {print s}') == 1 ]]
[[ $(grep -hxc 'EMPTY' "$tmp/"* | awk '{s+=$1} END {print s}') == 3 ]]
echo "Persistent session authorization concurrency passed."
