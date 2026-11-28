-- Staged only. This NOLOGIN role cannot authenticate by itself.
-- A dedicated deployment-specific LOGIN role may be granted membership only
-- after isolated integration testing and security review.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'deletion_backend') then
    create role deletion_backend nologin noinherit;
  end if;
end
$$;

grant usage on schema private to deletion_backend;
grant usage on schema public to deletion_backend;
grant select, insert, update on table public.account_deletion_challenges to deletion_backend;
grant select, insert, update on table public.account_deletion_authorizations to deletion_backend;

grant execute on function private.issue_account_deletion_challenge(uuid,uuid,text,timestamptz)
  to deletion_backend;
grant execute on function private.activate_account_deletion_challenge(uuid,uuid)
  to deletion_backend;
grant execute on function private.consume_account_deletion_challenge(uuid,uuid,text)
  to deletion_backend;
grant execute on function private.exchange_account_deletion_challenge(uuid,uuid,text,text)
  to deletion_backend;
grant execute on function private.consume_account_deletion_authorization(uuid,uuid,text)
  to deletion_backend;

-- This role has no DELETE, TRUNCATE, or direct access to auth.users.
-- It cannot delete accounts. Keep login credentials outside migrations.
