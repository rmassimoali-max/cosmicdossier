-- REVIEW ONLY. Disposable PostgreSQL fixture, not a migration.
-- Run only in an isolated database with synthetic auth.sessions.
-- Column-level SELECT intentionally permits enumeration of IDs by this role.
-- It is not a function-only capability and must not be granted to existing workers.
begin;
create table auth.sessions (
  id uuid primary key,
  user_id uuid not null,
  private_fixture_value text not null
);
insert into auth.sessions values
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'synthetic');
create role deletion_session_presence_reader nologin noinherit nosuperuser
  nocreatedb nocreaterole nobypassrls;
grant usage on schema auth to deletion_session_presence_reader;
grant select (id, user_id) on auth.sessions to deletion_session_presence_reader;

-- Verify the exact query shape used by the staged adapter.
set local role deletion_session_presence_reader;
do $
begin
  if not exists (
    select 1 from auth.sessions
    where id = '22222222-2222-4222-8222-222222222222'::uuid
      and user_id = '11111111-1111-4111-8111-111111111111'::uuid
  ) then
    raise exception 'Matching session missing';
  end if;
  if exists (
    select 1 from auth.sessions
    where id = '22222222-2222-4222-8222-222222222222'::uuid
      and user_id = '33333333-3333-4333-8333-333333333333'::uuid
  ) then
    raise exception 'Cross-account session accepted';
  end if;
  begin
    perform private_fixture_value from auth.sessions;
    raise exception 'Private column readable';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from auth.sessions;
    raise exception 'Session deletion allowed';
  exception when insufficient_privilege then null;
  end;
end
$;
reset role;

do $$
begin
  if has_table_privilege('deletion_session_presence_reader', 'auth.sessions', 'SELECT')
     or has_table_privilege('deletion_session_presence_reader', 'auth.sessions', 'INSERT,UPDATE,DELETE,TRUNCATE')
     or has_table_privilege('deletion_session_presence_reader', 'auth.users', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
  then
    raise exception 'Unexpected session reader privileges';
  end if;
  if not has_column_privilege('deletion_session_presence_reader', 'auth.sessions', 'id', 'SELECT')
     or not has_column_privilege('deletion_session_presence_reader', 'auth.sessions', 'user_id', 'SELECT')
  then
    raise exception 'Missing session reader privileges';
  end if;
end
$$;
rollback;
