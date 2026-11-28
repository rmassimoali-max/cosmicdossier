-- Staged only; no production activation.
begin;
create table private.deletion_session_authorizations (
  slot text primary key check (slot ~ '^[0-9a-f]{64}$'),
  envelope text not null check (length(envelope) between 1 and 4096),
  expires_at timestamptz not null
);
alter table private.deletion_session_authorizations enable row level security;
revoke all on private.deletion_session_authorizations from public, anon, authenticated, service_role;
grant select, insert, update, delete on private.deletion_session_authorizations to deletion_backend;
create policy deletion_session_backend on private.deletion_session_authorizations
  for all to deletion_backend using (true) with check (true);
create index deletion_session_expiry_idx on private.deletion_session_authorizations(expires_at);

create function private.put_deletion_session_authorization(p_slot text, p_envelope text, p_ttl integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_slot is null or p_slot !~ '^[0-9a-f]{64}$'
     or p_envelope is null or length(p_envelope) not between 1 and 4096
     or p_ttl is null or p_ttl not between 1 and 240000 then
    return false;
  end if;
  insert into private.deletion_session_authorizations(slot, envelope, expires_at)
    values (p_slot, p_envelope, clock_timestamp() + p_ttl * interval '1 millisecond')
    on conflict (slot) do update set envelope = excluded.envelope, expires_at = excluded.expires_at;
  return true;
end;
$$;

create function private.take_deletion_session_authorization(p_slot text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  v_envelope text;
  v_expiry timestamptz;
begin
  delete from private.deletion_session_authorizations
    where slot = p_slot returning envelope, expires_at into v_envelope, v_expiry;
  if v_expiry > clock_timestamp() then return v_envelope; end if;
  return null;
end;
$$;
revoke all on function private.put_deletion_session_authorization(text,text,integer) from public, anon, authenticated, service_role;
revoke all on function private.take_deletion_session_authorization(text) from public, anon, authenticated, service_role;
grant execute on function private.put_deletion_session_authorization(text,text,integer) to deletion_backend;
grant execute on function private.take_deletion_session_authorization(text) to deletion_backend;
commit;
