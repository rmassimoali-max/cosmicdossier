-- All fixture changes are rolled back. Isolated test database only.
begin;
insert into auth.users(id) values
  ('55555555-5555-4555-8555-555555555555'),
  ('66666666-6666-4666-8666-666666666666');

do $$
declare
  v_a uuid := '55555555-5555-4555-8555-555555555555';
  v_b uuid := '66666666-6666-4666-8666-666666666666';
  v_first uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  v_second uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
begin
  if not private.issue_account_deletion_challenge(
    v_first, v_a, repeat('a',64), clock_timestamp()+interval '9 minutes'
  ) then
    raise exception 'First challenge should be accepted';
  end if;
  if private.issue_account_deletion_challenge(
    v_second, v_a, repeat('b',64), clock_timestamp()+interval '9 minutes'
  ) then
    raise exception 'Same-account immediate retry bypassed cooldown';
  end if;
  if not private.issue_account_deletion_challenge(
    v_second, v_b, repeat('b',64), clock_timestamp()+interval '9 minutes'
  ) then
    raise exception 'Unrelated account incorrectly throttled';
  end if;
  if private.issue_account_deletion_challenge(
    gen_random_uuid(), v_a, 'bad', clock_timestamp()+interval '9 minutes'
  ) then
    raise exception 'Malformed token hash was accepted';
  end if;
  if private.issue_account_deletion_challenge(
    gen_random_uuid(), v_a, repeat('c',64), clock_timestamp()+interval '12 minutes'
  ) then
    raise exception 'Overlong expiry was accepted';
  end if;

  -- Backdate only the fixture to simulate elapsed time.
  update public.account_deletion_challenges
  set created_at = clock_timestamp() - interval '2 minutes'
  where id = v_first;
  if not private.issue_account_deletion_challenge(
    gen_random_uuid(), v_a, repeat('d',64), clock_timestamp()+interval '9 minutes'
  ) then
    raise exception 'Request after cooldown should succeed';
  end if;
  if not exists (
    select 1 from public.account_deletion_challenges
    where id = v_first and consumed_at is not null
  ) then
    raise exception 'Earlier challenge remained active';
  end if;
  raise notice 'PASS: cooldown, user isolation, expiry validation, and supersession';
end;
$$;
rollback;
