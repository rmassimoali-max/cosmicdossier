-- Staged only: single-use authorization consumption. Do not apply to live
-- Supabase until privileged server access and isolated integration tests exist.
-- A successful result does not delete an account or invalidate JWTs.
create or replace function private.consume_account_deletion_authorization(
  p_authorization_id uuid,
  p_user_id uuid,
  p_authorization_hash text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_consumed_id uuid;
begin
  if p_authorization_id is null
     or p_user_id is null
     or p_authorization_hash is null
     or p_authorization_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  -- A single conditional UPDATE serializes competing consumers. PostgreSQL
  -- rechecks the predicate after waiting for a concurrent row update.
  update public.account_deletion_authorizations
  set consumed_at = now()
  where id = p_authorization_id
    and user_id = p_user_id
    and authorization_hash = p_authorization_hash
    and consumed_at is null
    and expires_at > now()
    and created_at <= now()
    and expires_at <= created_at + interval '5 minutes'
  returning id into v_consumed_id;

  return v_consumed_id is not null;
end;
$$;

revoke all on function private.consume_account_deletion_authorization(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function private.consume_account_deletion_authorization(uuid, uuid, text)
  to postgres;

comment on function private.consume_account_deletion_authorization(uuid, uuid, text) is
  'Server-only atomic one-time authorization consumption. Requires separate fresh Auth, CSRF and origin checks before any future destructive operation.';
