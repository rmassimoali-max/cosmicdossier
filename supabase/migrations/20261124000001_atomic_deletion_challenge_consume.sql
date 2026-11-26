-- Staged follow-up. Apply only after reviewing the base storage migration.
-- This routine is deliberately in a non-exposed schema, and executable only
-- by the privileged server database role. Never expose it through client RPC.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to postgres;

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

  -- Lock the row until the transaction ends. Concurrent requests serialize.
  select * into v_challenge
  from public.account_deletion_challenges
  where id = p_challenge_id and user_id = p_user_id
  for update;

  if not found
     or v_challenge.purpose <> 'account_deletion'
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
  where id = p_challenge_id
    and user_id = p_user_id
    and consumed_at is null
    and expires_at > now()
    and attempts < 5;

  return found;
end;
$$;

revoke all on function private.consume_account_deletion_challenge(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function private.consume_account_deletion_challenge(uuid, uuid, text)
  to postgres;

comment on function private.consume_account_deletion_challenge(uuid, uuid, text) is
  'Privileged server-only atomic challenge consumption. A true result is NOT deletion authorization; separate short-lived authorization issuance is required.';
