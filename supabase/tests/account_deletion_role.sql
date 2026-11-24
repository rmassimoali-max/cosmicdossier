-- Verify role isolation without ever creating login credentials.
do $$
declare
  v_role pg_catalog.pg_roles%rowtype;
begin
  select * into v_role from pg_catalog.pg_roles where rolname = 'deletion_backend';
  if not found or v_role.rolcanlogin or v_role.rolsuper or v_role.rolcreaterole
     or v_role.rolcreatedb or v_role.rolbypassrls then
    raise exception 'Deletion backend role is missing or overly privileged';
  end if;
  if not pg_catalog.has_schema_privilege('deletion_backend', 'private', 'USAGE')
     or not pg_catalog.has_table_privilege(
       'deletion_backend', 'public.account_deletion_challenges', 'SELECT'
     )
     or not pg_catalog.has_table_privilege(
       'deletion_backend', 'public.account_deletion_authorizations', 'SELECT'
     ) then
    raise exception 'Deletion backend lacks required verification privileges';
  end if;
  if not pg_catalog.has_table_privilege(
       'deletion_backend', 'public.account_deletion_challenges', 'INSERT'
     ) or not pg_catalog.has_table_privilege(
       'deletion_backend', 'public.account_deletion_challenges', 'UPDATE'
     ) or not pg_catalog.has_table_privilege(
       'deletion_backend', 'public.account_deletion_authorizations', 'INSERT'
     ) or not pg_catalog.has_table_privilege(
       'deletion_backend', 'public.account_deletion_authorizations', 'UPDATE'
     ) then
    raise exception 'Deletion backend lacks write privileges';
  end if;
  if pg_catalog.has_table_privilege(
       'deletion_backend', 'public.account_deletion_challenges', 'DELETE'
     ) or pg_catalog.has_table_privilege(
       'deletion_backend', 'public.account_deletion_authorizations', 'DELETE'
     ) or pg_catalog.has_table_privilege(
       'deletion_backend', 'auth.users', 'DELETE'
     ) then
    raise exception 'Deletion backend role has destructive table privileges';
  end if;
  if not pg_catalog.has_function_privilege(
       'deletion_backend',
       'private.issue_account_deletion_challenge(uuid,uuid,text,timestamptz)', 'EXECUTE'
     ) or not pg_catalog.has_function_privilege(
       'deletion_backend',
       'private.activate_account_deletion_challenge(uuid,uuid)', 'EXECUTE'
     ) or not pg_catalog.has_function_privilege(
       'deletion_backend',
       'private.exchange_account_deletion_challenge(uuid,uuid,text,text)', 'EXECUTE'
     ) then
    raise exception 'Deletion backend lacks protected verification function access';
  end if;
  if pg_catalog.has_function_privilege(
       'authenticated',
       'private.issue_account_deletion_challenge(uuid,uuid,text,timestamptz)', 'EXECUTE'
     ) or pg_catalog.has_function_privilege(
       'anon',
       'private.activate_account_deletion_challenge(uuid,uuid)', 'EXECUTE'
     ) then
    raise exception 'Client role gained deletion verification function access';
  end if;
  raise notice 'PASS: deletion backend NOLOGIN and least-privilege grants';
end;
$$;
