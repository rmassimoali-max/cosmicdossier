-- REVIEW ONLY. Disposable PostgreSQL CI only; never apply to a live project.
begin;
create table private.deletion_fresh_auth_attempts (
  user_id uuid not null,
  attempted_at timestamptz not null
);
create index on private.deletion_fresh_auth_attempts (user_id, attempted_at);
alter table private.deletion_fresh_auth_attempts enable row level security;
revoke all on private.deletion_fresh_auth_attempts from public, anon, authenticated;

create function private.reserve_deletion_fresh_auth_attempt(p_user_id uuid)
returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare
  v_now timestamptz;
begin
  if p_user_id is null then return false; end if;
  -- Serialize per account; take the timestamp after acquiring the lock.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 873422));
  v_now := clock_timestamp();
  if exists (
    select 1 from private.deletion_fresh_auth_attempts
    where user_id = p_user_id and attempted_at > v_now - interval '1 minute'
  ) or (
    select count(*) from private.deletion_fresh_auth_attempts
    where user_id = p_user_id and attempted_at > v_now - interval '1 hour'
  ) >= 5 then return false; end if;
  insert into private.deletion_fresh_auth_attempts values (p_user_id, v_now);
  return true;
end;
$$;
revoke all on function private.reserve_deletion_fresh_auth_attempt(uuid)
  from public, anon, authenticated;

-- Owner-only synthetic tests. Runtime role grants and cleanup remain separate.
do $$
declare
  a uuid := '11111111-1111-4111-8111-111111111111';
  b uuid := '22222222-2222-4222-8222-222222222222';
begin
  if private.reserve_deletion_fresh_auth_attempt(null) is distinct from false
    or private.reserve_deletion_fresh_auth_attempt(a) is distinct from true
    or private.reserve_deletion_fresh_auth_attempt(a) is distinct from false
    or private.reserve_deletion_fresh_auth_attempt(b) is distinct from true then
    raise exception 'Initial reservation or account isolation failed';
  end if;
  update private.deletion_fresh_auth_attempts set attempted_at = clock_timestamp() - interval '2 minutes'
    where user_id = a;
  insert into private.deletion_fresh_auth_attempts
    select a, clock_timestamp() - make_interval(mins => n) from generate_series(3, 6) n;
  if private.reserve_deletion_fresh_auth_attempt(a) is distinct from false then
    raise exception 'Hourly limit failed';
  end if;
  update private.deletion_fresh_auth_attempts set attempted_at = clock_timestamp() - interval '61 minutes'
    where user_id = a;
  if private.reserve_deletion_fresh_auth_attempt(a) is distinct from true then
    raise exception 'Expired history blocked reservation';
  end if;
  if has_function_privilege('authenticated', 'private.reserve_deletion_fresh_auth_attempt(uuid)', 'execute')
    or has_table_privilege('anon', 'private.deletion_fresh_auth_attempts', 'insert') then
    raise exception 'Unexpected client privileges';
  end if;
end;
$$;
rollback;
