-- Staged server-only transaction: verify a challenge and issue one short-lived
-- authorization atomically. This function does not delete any account.
create or replace function private.exchange_account_deletion_challenge(
  p_challenge_id uuid,
  p_user_id uuid,
  p_challenge_hash text,
  p_authorization_hash text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_authorization_id uuid;
begin
  if p_authorization_hash is null
     or p_authorization_hash !~ '^[0-9a-f]{64}$'
     or p_authorization_hash = p_challenge_hash then
    return null;
  end if;

  if not private.consume_account_deletion_challenge(
    p_challenge_id, p_user_id, p_challenge_hash
  ) then
    return null;
  end if;

  insert into public.account_deletion_authorizations(
    user_id, authorization_hash, expires_at
  ) values (
    p_user_id, p_authorization_hash, now() + interval '5 minutes'
  )
  returning id into v_authorization_id;

  return v_authorization_id;
end;
$$;

revoke all on function private.exchange_account_deletion_challenge(uuid,uuid,text,text)
  from public, anon, authenticated;
grant execute on function private.exchange_account_deletion_challenge(uuid,uuid,text,text)
  to postgres;

comment on function private.exchange_account_deletion_challenge(uuid,uuid,text,text) is
  'Privileged server-only challenge exchange. Caller must generate and securely deliver the raw authorization secret; only its hash is stored. Not an account deletion endpoint.';
