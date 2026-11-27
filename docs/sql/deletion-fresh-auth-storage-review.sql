-- REVIEW ONLY. Not a migration. Do not execute on production or development.
-- Proposed dedicated storage; no grants or callable functions in this draft.
begin;

create table private.deletion_fresh_auth_flows (
  flow_hash text primary key check (flow_hash ~ '^[0-9a-f]{64}$'),
  browser_hash text not null check (browser_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_session_id uuid not null,
  started_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  check (expires_at > started_at),
  check (expires_at <= started_at + interval '10 minutes')
);

alter table private.deletion_fresh_auth_flows enable row level security;
revoke all on private.deletion_fresh_auth_flows from public, anon, authenticated;
create index deletion_fresh_auth_flows_expiry_idx
  on private.deletion_fresh_auth_flows (expires_at);

-- Proposed atomic take statement for a future restricted adapter:
-- delete from private.deletion_fresh_auth_flows
-- where flow_hash = $1 and browser_hash = $2
--   and expires_at > clock_timestamp()
-- returning user_id, original_session_id, started_at, expires_at;
--
-- Issue with INSERT only, no upsert or replacement of existing flow IDs.
-- Derive hashes server-side with domain-separated HMACs and high-entropy secrets.
-- Never store raw browser secrets or provider tokens here.
-- Define restricted role/function permissions, rate limits, bounded cleanup,
-- and concurrent consumption tests before promoting to a migration.
-- The browser binding returned to the policy must be derived from trusted
-- request state, not accepted as a caller-supplied assertion.
rollback;
