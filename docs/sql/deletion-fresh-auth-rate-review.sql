-- REVIEW ONLY. Disposable PostgreSQL CI only; never apply to a live project.
begin;
create table private.deletion_fresh_auth_attempts (
  attempt_id bigint generated always as identity primary key,
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
  insert into private.deletion_fresh_auth_attempts (user_id, attempted_at) values (p_user_id, v_now);
  return true;
end;
$$;
revoke all on function private.reserve_deletion_fresh_auth_attempt(uuid)
  from public, anon, authenticated;

create index on private.deletion_fresh_auth_attempts (attempted_at, attempt_id);
create function private.cleanup_deletion_fresh_auth_attempts()
returns bigint
language sql security invoker set search_path = ''
as $$
  with expired as (
    select attempt_id from private.deletion_fresh_auth_attempts
    where attempted_at < statement_timestamp() - interval '1 hour'
    order by attempted_at, attempt_id
    limit 500 for update skip locked
  ), removed as (
    delete from private.deletion_fresh_auth_attempts a
    using expired e where a.attempt_id = e.attempt_id
    returning 1
  )
  select count(*) from removed;
$$;
revoke all on function private.cleanup_deletion_fresh_auth_attempts()
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
  insert into private.deletion_fresh_auth_attempts (user_id, attempted_at)
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
do $$
begin
  insert into private.deletion_fresh_auth_attempts (user_id, attempted_at)
    select '33333333-3333-4333-8333-333333333333', clock_timestamp() - interval '2 hours'
    from generate_series(1, 501);
  if private.cleanup_deletion_fresh_auth_attempts() <> 500 then
    raise exception 'Cleanup batch limit failed';
  end if;
  if private.cleanup_deletion_fresh_auth_attempts() <> 6 then
    raise exception 'Remaining expired attempts not removed';
  end if;
  if private.cleanup_deletion_fresh_auth_attempts() <> 0
    or (select count(*) from private.deletion_fresh_auth_attempts) <> 2 then
    raise exception 'Cleanup removed active history';
  end if;
end;
$$;
rollback;
