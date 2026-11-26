-- Staged only. A privileged server role must call this function.
-- Per-account issuance is serialized with a transaction-scoped advisory lock.
-- One challenge per minute, at most five per hour, one active challenge.
create or replace function private.issue_account_deletion_challenge(
  p_id uuid,
  p_user_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
begin
  if p_id is null or p_user_id is null
     or p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$'
     or p_expires_at is null
     or p_expires_at <= v_now
     or p_expires_at > v_now + interval '10 minutes' then
    return false;
  end if;

  -- Same-account requests serialize even when no prior challenge exists.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 873421)
  );

  if exists (
    select 1 from public.account_deletion_challenges
    where user_id = p_user_id
      and created_at > v_now - interval '1 minute'
  ) or (
    select count(*) from public.account_deletion_challenges
    where user_id = p_user_id
      and created_at > v_now - interval '1 hour'
  ) >= 5 then
    return false;
  end if;

  -- Invalidate earlier challenges; do not delete history used for throttling.
  update public.account_deletion_challenges
  set consumed_at = v_now
  where user_id = p_user_id and consumed_at is null;

  insert into public.account_deletion_challenges(
    id, user_id, token_hash, created_at, expires_at
  ) values (p_id, p_user_id, p_token_hash, v_now, p_expires_at);

  return true;
end;
$$;

revoke all on function private.issue_account_deletion_challenge(uuid,uuid,text,timestamptz)
  from public, anon, authenticated;
grant execute on function private.issue_account_deletion_challenge(uuid,uuid,text,timestamptz)
  to postgres;
