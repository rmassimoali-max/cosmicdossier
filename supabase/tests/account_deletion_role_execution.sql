-- Transaction-only impersonation of the restricted NOLOGIN role in CI.
begin;
insert into auth.users(id) values ('77777777-7777-4777-8777-777777777777');
set local role deletion_backend;

do $$
declare
  v_user uuid := '77777777-7777-4777-8777-777777777777';
  v_id uuid := '77777777-aaaa-4aaa-8aaa-777777777777';
  v_auth uuid;
begin
  if not private.issue_account_deletion_challenge(
    v_id, v_user, repeat('a',64), clock_timestamp()+interval '9 minutes'
  ) then
    raise exception 'Restricted role could not issue challenge';
  end if;
  if private.consume_account_deletion_challenge(v_id,v_user,repeat('a',64)) then
    raise exception 'Pending challenge was consumed by restricted role';
  end if;
  if not private.activate_account_deletion_challenge(v_id,v_user) then
    raise exception 'Restricted role could not activate challenge';
  end if;
  v_auth := private.exchange_account_deletion_challenge(
    v_id,v_user,repeat('a',64),repeat('b',64)
  );
  if v_auth is null then
    raise exception 'Restricted role could not exchange verified challenge';
  end if;
  if not private.consume_account_deletion_authorization(
    v_auth,v_user,repeat('b',64)
  ) then
    raise exception 'Restricted role could not consume authorization';
  end if;
  if private.consume_account_deletion_authorization(
    v_auth,v_user,repeat('b',64)
  ) then
    raise exception 'Restricted role replayed authorization';
  end if;
  raise notice 'PASS: restricted role can complete verification without account deletion';
end;
$$;

-- Assert a destructive statement fails under the same restricted role.
do $$
begin
  begin
    delete from public.account_deletion_challenges
    where user_id = '77777777-7777-4777-8777-777777777777';
    raise exception 'Restricted role unexpectedly deleted challenge';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;
rollback;
