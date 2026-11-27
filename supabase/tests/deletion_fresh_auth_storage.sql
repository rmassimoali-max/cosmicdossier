-- Disposable CI-only prototype. Entire test, role and objects roll back.
begin;

create role deletion_fresh_auth_ci nologin noinherit;
create table private.deletion_fresh_auth_ci_flows (
  flow_hash text primary key check (flow_hash ~ '^[0-9a-f]{64}$'),
  browser_hash text not null check (browser_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_session_id uuid not null,
  started_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  check (expires_at > started_at),
  check (expires_at <= started_at + interval '10 minutes')
);
alter table private.deletion_fresh_auth_ci_flows enable row level security;
create policy deletion_fresh_auth_ci_access
  on private.deletion_fresh_auth_ci_flows
  to deletion_fresh_auth_ci using (true) with check (true);

grant usage on schema private to deletion_fresh_auth_ci;
grant select, insert, delete on private.deletion_fresh_auth_ci_flows to deletion_fresh_auth_ci;

create function private.take_deletion_fresh_auth_ci_flow(p_flow text,p_browser text)
returns table(user_id uuid, original_session_id uuid)
language sql security invoker set search_path=''
as $$
  delete from private.deletion_fresh_auth_ci_flows f
  where f.flow_hash=p_flow and f.browser_hash=p_browser
    and f.expires_at > clock_timestamp()
  returning f.user_id,f.original_session_id;
$$;
revoke all on function private.take_deletion_fresh_auth_ci_flow(text,text) from public,anon,authenticated;
grant execute on function private.take_deletion_fresh_auth_ci_flow(text,text) to deletion_fresh_auth_ci;

insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');

do $$
begin
  if not has_table_privilege('deletion_fresh_auth_ci','private.deletion_fresh_auth_ci_flows','SELECT')
     or not has_table_privilege('deletion_fresh_auth_ci','private.deletion_fresh_auth_ci_flows','INSERT')
     or not has_table_privilege('deletion_fresh_auth_ci','private.deletion_fresh_auth_ci_flows','DELETE')
     or has_table_privilege('deletion_fresh_auth_ci','private.deletion_fresh_auth_ci_flows','UPDATE')
     or has_table_privilege('deletion_fresh_auth_ci','private.deletion_fresh_auth_ci_flows','TRUNCATE')
     or has_table_privilege('deletion_fresh_auth_ci','auth.users','DELETE') then
    raise exception 'Fresh-auth role has unexpected privileges';
  end if;
  if has_function_privilege('anon','private.take_deletion_fresh_auth_ci_flow(text,text)','EXECUTE')
     or has_function_privilege('authenticated','private.take_deletion_fresh_auth_ci_flow(text,text)','EXECUTE') then
    raise exception 'Client role can execute fresh-auth function';
  end if;
end;
$$;

set local role deletion_fresh_auth_ci;
insert into private.deletion_fresh_auth_ci_flows
 (flow_hash,browser_hash,user_id,original_session_id,expires_at)
values
 (repeat('a',64),repeat('b',64),'11111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',clock_timestamp()+interval '5 minutes'),
 (repeat('c',64),repeat('d',64),'22222222-2222-4222-8222-222222222222',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',clock_timestamp()+interval '5 minutes');

do $$
declare v_count integer;
begin
  select count(*) into v_count from private.take_deletion_fresh_auth_ci_flow(repeat('a',64),repeat('x',64));
  if v_count <> 0 then raise exception 'Wrong browser consumed flow'; end if;
  select count(*) into v_count from private.take_deletion_fresh_auth_ci_flow(repeat('a',64),repeat('b',64));
  if v_count <> 1 then raise exception 'Correct browser did not consume exactly one flow'; end if;
  select count(*) into v_count from private.take_deletion_fresh_auth_ci_flow(repeat('a',64),repeat('b',64));
  if v_count <> 0 then raise exception 'Flow replay succeeded'; end if;
  if not exists(select 1 from private.deletion_fresh_auth_ci_flows where flow_hash=repeat('c',64)) then
    raise exception 'One account operation affected unrelated account flow';
  end if;
  raise notice 'PASS: fresh-auth restricted role, browser binding, single-use and account isolation';
end;
$$;

reset role;
rollback;
