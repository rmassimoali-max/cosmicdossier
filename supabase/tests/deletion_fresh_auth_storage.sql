-- Disposable CI-only prototype. Entire test, role and objects roll back.
begin;

create role deletion_fresh_auth_ci nologin noinherit;
-- The runner injects the exact rollback-only review draft here.
-- FRESH_AUTH_REVIEW_DRAFT

create policy deletion_fresh_auth_ci_access
  on private.deletion_fresh_auth_flows
  to deletion_fresh_auth_ci using (true) with check (true);

grant usage on schema private to deletion_fresh_auth_ci;
grant select, insert, delete on private.deletion_fresh_auth_flows to deletion_fresh_auth_ci;

grant execute on function private.issue_deletion_fresh_auth_flow(text,text,uuid,uuid) to deletion_fresh_auth_ci;
grant execute on function private.take_deletion_fresh_auth_flow(text,text) to deletion_fresh_auth_ci;

insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');

do $$
begin
  if not has_table_privilege('deletion_fresh_auth_ci','private.deletion_fresh_auth_flows','SELECT')
     or not has_table_privilege('deletion_fresh_auth_ci','private.deletion_fresh_auth_flows','INSERT')
     or not has_table_privilege('deletion_fresh_auth_ci','private.deletion_fresh_auth_flows','DELETE')
     or has_table_privilege('deletion_fresh_auth_ci','private.deletion_fresh_auth_flows','UPDATE')
     or has_table_privilege('deletion_fresh_auth_ci','private.deletion_fresh_auth_flows','TRUNCATE')
     or has_table_privilege('deletion_fresh_auth_ci','auth.users','DELETE') then
    raise exception 'Fresh-auth role has unexpected privileges';
  end if;
  if has_function_privilege('anon','private.take_deletion_fresh_auth_flow(text,text)','EXECUTE')
     or has_function_privilege('authenticated','private.take_deletion_fresh_auth_flow(text,text)','EXECUTE') then
    raise exception 'Client role can execute fresh-auth function';
  end if;
end;
$$;

set local role deletion_fresh_auth_ci;
insert into private.deletion_fresh_auth_flows
 (flow_hash,browser_hash,user_id,original_session_id,expires_at)
values
 (repeat('a',64),repeat('b',64),'11111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',clock_timestamp()+interval '5 minutes'),
 (repeat('c',64),repeat('d',64),'22222222-2222-4222-8222-222222222222',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',clock_timestamp()+interval '5 minutes');

do $$
declare v_count integer;
begin
  select count(*) into v_count from private.take_deletion_fresh_auth_flow(repeat('a',64),repeat('x',64));
  if v_count <> 0 then raise exception 'Wrong browser consumed flow'; end if;
  select count(*) into v_count from private.take_deletion_fresh_auth_flow(repeat('a',64),repeat('b',64));
  if v_count <> 1 then raise exception 'Correct browser did not consume exactly one flow'; end if;
  select count(*) into v_count from private.take_deletion_fresh_auth_flow(repeat('a',64),repeat('b',64));
  if v_count <> 0 then raise exception 'Flow replay succeeded'; end if;
  if not exists(select 1 from private.deletion_fresh_auth_flows where flow_hash=repeat('c',64)) then
    raise exception 'One account operation affected unrelated account flow';
  end if;
  raise notice 'PASS: fresh-auth restricted role, browser binding, single-use and account isolation';
end;
$$;

reset role;

-- Cleanup has a separate capability and expiry-limited RLS policies.
create role deletion_fresh_auth_cleanup_ci nologin noinherit;
grant usage on schema private to deletion_fresh_auth_cleanup_ci;
grant select, delete on private.deletion_fresh_auth_flows to deletion_fresh_auth_cleanup_ci;
create policy deletion_fresh_auth_cleanup_select_ci
  on private.deletion_fresh_auth_flows for select
  to deletion_fresh_auth_cleanup_ci using (expires_at <= clock_timestamp());
create policy deletion_fresh_auth_cleanup_delete_ci
  on private.deletion_fresh_auth_flows for delete
  to deletion_fresh_auth_cleanup_ci using (expires_at <= clock_timestamp());
create policy deletion_fresh_auth_cleanup_lock_ci
  on private.deletion_fresh_auth_flows for update
  to deletion_fresh_auth_cleanup_ci using (expires_at <= clock_timestamp())
  with check (false);

grant execute on function private.cleanup_deletion_fresh_auth_flows() to deletion_fresh_auth_cleanup_ci;
-- PostgreSQL row locking requires UPDATE privilege. Grant only one column,
-- with an UPDATE policy that permits locking expired rows but rejects all new row versions.
grant update(flow_hash) on private.deletion_fresh_auth_flows to deletion_fresh_auth_cleanup_ci;

insert into private.deletion_fresh_auth_flows
 (flow_hash,browser_hash,user_id,original_session_id,started_at,expires_at)
select lpad(to_hex(i),64,'0'),repeat('b',64),
 '11111111-1111-4111-8111-111111111111',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 clock_timestamp()-interval '9 minutes',clock_timestamp()-interval '1 minute'
from generate_series(1,501) i;

set local role deletion_fresh_auth_ci;
do $$
begin
  if exists(select 1 from private.take_deletion_fresh_auth_flow(lpad('1',64,'0'),repeat('b',64))) then
    raise exception 'Expired flow consumed';
  end if;
  if has_function_privilege(current_user,'private.cleanup_deletion_fresh_auth_flows()','EXECUTE') then
    raise exception 'Runtime role can execute cleanup';
  end if;
end;
$$;
reset role;

set local role deletion_fresh_auth_cleanup_ci;
do $$
declare n bigint;
begin
  delete from private.deletion_fresh_auth_flows where flow_hash=repeat('c',64);
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Cleanup deleted unexpired flow'; end if;
  update private.deletion_fresh_auth_flows set flow_hash=repeat('f',64)
    where flow_hash=repeat('c',64);
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Cleanup updated flow'; end if;
  begin
    update private.deletion_fresh_auth_flows set flow_hash=repeat('f',64)
      where flow_hash=lpad('1',64,'0');
    raise exception 'Cleanup unexpectedly updated expired flow';
  exception when insufficient_privilege then null;
  end;
  if private.cleanup_deletion_fresh_auth_flows() <> 500 then
    raise exception 'Cleanup did not remove exactly 500 expired flows';
  end if;
  if private.cleanup_deletion_fresh_auth_flows() <> 1 then
    raise exception 'Cleanup did not remove final expired flow';
  end if;
end;
$$;
reset role;
do $$
begin
  if (select count(*) from private.deletion_fresh_auth_flows) <> 1
     or not exists(select 1 from private.deletion_fresh_auth_flows where flow_hash=repeat('c',64)) then
    raise exception 'Cleanup failed to preserve unexpired flow';
  end if;
  raise notice 'PASS: expired flow rejection and bounded isolated cleanup';
end;
$$;

rollback;
