-- Staged only: a challenge is unusable until email acceptance is recorded.
alter table public.account_deletion_challenges
  add column if not exists delivered_at timestamptz;

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
    set delivered_at = clock_timestamp()
    where id = p_id and user_id = p_user_id
      and delivered_at is null and consumed_at is null
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

-- Consumption is blocked for pending challenges, including when delivery
-- failure and revocation failure occur together.
create or replace function private.consume_account_deletion_challenge(
  p_challenge_id uuid,
  p_user_id uuid,
  p_token_hash text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_challenge public.account_deletion_challenges%rowtype;
begin
  if p_challenge_id is null or p_user_id is null
     or p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  select * into v_challenge
  from public.account_deletion_challenges
  where id = p_challenge_id and user_id = p_user_id
  for update;

  if not found
     or v_challenge.purpose <> 'account_deletion'
     or v_challenge.delivered_at is null
     or v_challenge.consumed_at is not null
     or v_challenge.expires_at <= now()
     or v_challenge.attempts >= 5 then
    return false;
  end if;

  if v_challenge.token_hash <> p_token_hash then
    update public.account_deletion_challenges
    set attempts = attempts + 1
    where id = p_challenge_id and attempts < 5;
    return false;
  end if;

  update public.account_deletion_challenges
  set consumed_at = now()
  where id = p_challenge_id and user_id = p_user_id
    and delivered_at is not null and consumed_at is null
    and expires_at > now() and attempts < 5;
  return found;
end;
$$;

revoke all on function private.consume_account_deletion_challenge(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function private.consume_account_deletion_challenge(uuid,uuid,text)
  to postgres;
