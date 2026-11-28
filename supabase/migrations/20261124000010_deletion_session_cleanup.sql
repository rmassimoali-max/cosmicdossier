-- Staged only. Opportunistic bounded cleanup; no scheduler or account deletion.
begin;
create function private.prune_deletion_session_authorizations()
returns integer language plpgsql security invoker set search_path = '' as $$
declare
  removed integer;
begin
  with expired as (
    select slot from private.deletion_session_authorizations
    where expires_at <= clock_timestamp()
    order by expires_at limit 100 for update skip locked
  )
  delete from private.deletion_session_authorizations as s
    using expired where s.slot = expired.slot;
  get diagnostics removed = row_count;
  return removed;
end;
$$;
revoke all on function private.prune_deletion_session_authorizations() from public, anon, authenticated, service_role;
grant execute on function private.prune_deletion_session_authorizations() to deletion_backend;

create or replace function private.put_deletion_session_authorization(p_slot text, p_envelope text, p_ttl integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_slot is null or p_slot !~ '^[0-9a-f]{64}$'
     or p_envelope is null or length(p_envelope) not between 1 and 4096
     or p_ttl is null or p_ttl not between 1 and 240000 then
    return false;
  end if;
  perform private.prune_deletion_session_authorizations();
  insert into private.deletion_session_authorizations(slot, envelope, expires_at)
    values (p_slot, p_envelope, clock_timestamp() + p_ttl * interval '1 millisecond')
    on conflict (slot) do update set envelope = excluded.envelope, expires_at = excluded.expires_at;
  return true;
end;
$$;
commit;
