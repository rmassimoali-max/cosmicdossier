-- Run ONLY against an isolated test database after applying staged migrations.
-- Usage: psql -v ON_ERROR_STOP=1 -f supabase/tests/account_deletion_security.sql
-- No test accounts or production data are created or modified.
begin;

do $$
declare
  v_schema_oid oid;
  v_challenge oid;
  v_authorization oid;
  v_challenge_fn oid;
  v_authorization_fn oid;
  v_exchange_fn oid;
begin
  select oid into v_schema_oid from pg_namespace where nspname = 'private';
  if v_schema_oid is null then
    raise exception 'Missing private schema';
  end if;

  v_challenge := to_regclass('public.account_deletion_challenges');
  v_authorization := to_regclass('public.account_deletion_authorizations');
  v_challenge_fn := to_regprocedure('private.consume_account_deletion_challenge(uuid,uuid,text)');
  v_authorization_fn := to_regprocedure('private.consume_account_deletion_authorization(uuid,uuid,text)');
  v_exchange_fn := to_regprocedure('private.exchange_account_deletion_challenge(uuid,uuid,text,text)');

  if v_challenge is null or v_authorization is null
     or v_challenge_fn is null or v_authorization_fn is null
     or v_exchange_fn is null then
    raise exception 'Missing deletion storage or consume functions';
  end if;

  if not (select relrowsecurity from pg_class where oid = v_challenge)
     or not (select relrowsecurity from pg_class where oid = v_authorization) then
    raise exception 'Deletion tables must have RLS enabled';
  end if;

  if has_schema_privilege('anon', v_schema_oid, 'USAGE')
     or has_schema_privilege('authenticated', v_schema_oid, 'USAGE')
     or has_schema_privilege('anon', v_schema_oid, 'CREATE')
     or has_schema_privilege('authenticated', v_schema_oid, 'CREATE') then
    raise exception 'Client roles have private schema access';
  end if;

  if has_table_privilege('anon', v_challenge, 'SELECT,INSERT,UPDATE,DELETE')
     or has_table_privilege('authenticated', v_challenge, 'SELECT,INSERT,UPDATE,DELETE')
     or has_table_privilege('anon', v_authorization, 'SELECT,INSERT,UPDATE,DELETE')
     or has_table_privilege('authenticated', v_authorization, 'SELECT,INSERT,UPDATE,DELETE') then
    raise exception 'Client roles have deletion table privileges';
  end if;

  if has_function_privilege('anon', v_challenge_fn, 'EXECUTE')
     or has_function_privilege('authenticated', v_challenge_fn, 'EXECUTE')
     or has_function_privilege('anon', v_authorization_fn, 'EXECUTE')
     or has_function_privilege('authenticated', v_authorization_fn, 'EXECUTE')
     or has_function_privilege('anon', v_exchange_fn, 'EXECUTE')
     or has_function_privilege('authenticated', v_exchange_fn, 'EXECUTE') then
    raise exception 'Client roles can execute deletion consumption functions';
  end if;

  if (select prosecdef from pg_proc where oid = v_challenge_fn)
     or (select prosecdef from pg_proc where oid = v_authorization_fn)
     or (select prosecdef from pg_proc where oid = v_exchange_fn) then
    raise exception 'Deletion consume functions must not use SECURITY DEFINER';
  end if;

  raise notice 'PASS: RLS, table grants, schema grants, function grants, and invoker mode';
end;
$$;

rollback;
