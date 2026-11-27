-- REVIEW ONLY. Not a migration. Do not execute on production or development.
-- Proposed dedicated storage and private functions; no runtime grants.
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

-- Invoker functions intentionally require a separately reviewed restricted role.
-- No runtime role receives access in this draft.
create function private.issue_deletion_fresh_auth_flow(
  p_flow_hash text, p_browser_hash text, p_user_id uuid, p_session_id uuid
) returns boolean
language sql security invoker set search_path = ''
as $$
  insert into private.deletion_fresh_auth_flows
    (flow_hash, browser_hash, user_id, original_session_id, started_at, expires_at)
  select p_flow_hash, p_browser_hash, p_user_id, p_session_id, t, t + interval '10 minutes'
  from (select clock_timestamp() as t) as stamp
  returning true;
$$;

create function private.take_deletion_fresh_auth_flow(
  p_flow_hash text, p_browser_hash text
) returns table (
  user_id uuid, original_session_id uuid, started_at timestamptz, expires_at timestamptz
)
language sql security invoker set search_path = ''
as $$
  delete from private.deletion_fresh_auth_flows as f
  where f.flow_hash = p_flow_hash and f.browser_hash = p_browser_hash
    and f.expires_at > clock_timestamp()
  returning f.user_id, f.original_session_id, f.started_at, f.expires_at;
$$;

create function private.cleanup_deletion_fresh_auth_flows()
returns bigint
language sql security invoker set search_path = ''
as $$
  with expired as (
    select f.flow_hash from private.deletion_fresh_auth_flows as f
    where f.expires_at <= clock_timestamp()
    order by f.expires_at, f.flow_hash
    limit 500 for update skip locked
  ), removed as (
    delete from private.deletion_fresh_auth_flows as f
    using expired e where f.flow_hash = e.flow_hash
    returning 1
  )
  select count(*) from removed;
$$;

revoke all on function private.issue_deletion_fresh_auth_flow(text, text, uuid, uuid)
  from public, anon, authenticated;
revoke all on function private.take_deletion_fresh_auth_flow(text, text)
  from public, anon, authenticated;
revoke all on function private.cleanup_deletion_fresh_auth_flows()
  from public, anon, authenticated;

-- Issue with INSERT only; duplicate flow hashes fail rather than replace.
-- Derive hashes server-side with domain-separated HMACs and high-entropy secrets.
-- Never store raw browser secrets or provider tokens here.
-- Verify default ACLs, effective grants, RLS, provider identity, issuance rate limits,
-- and concurrent consumption in disposable PostgreSQL before granting runtime access.
-- Cleanup is bounded to 500 expired rows per invocation; scheduling is not implemented.
-- Browser binding must originate from trusted request state.
rollback;
