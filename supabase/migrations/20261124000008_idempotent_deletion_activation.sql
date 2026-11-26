-- Staged only. An activation retry must be idempotent after an
-- ambiguous network failure, but never revive revoked/expired challenges.
create or replace function private.activate_account_deletion_challenge(
  p_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with activated as (
    update public.account_deletion_challenges
    set delivered_at = coalesce(delivered_at, clock_timestamp())
    where id = p_id and user_id = p_user_id
      and consumed_at is null
      and expires_at > clock_timestamp()
      and purpose = 'account_deletion'
    returning id
  )
  select exists(select 1 from activated);
$$;

revoke all on function private.activate_account_deletion_challenge(uuid,uuid)
  from public, anon, authenticated;
grant execute on function private.activate_account_deletion_challenge(uuid,uuid)
  to postgres;
