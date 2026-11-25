-- Behavioral tests run only in the disposable CI PostgreSQL database.
-- Transaction rollback ensures test records are never retained.
begin;

do $$
declare
  v_user uuid := '11111111-1111-4111-8111-111111111111';
  v_other uuid := '22222222-2222-4222-8222-222222222222';
  v_challenge uuid;
  v_auth uuid;
  v_exchange uuid;
  v_hash text := repeat('a', 64);
  v_bad_hash text := repeat('b', 64);
  v_attempts integer;
begin
  insert into auth.users(id) values (v_user), (v_other);
  insert into public.account_deletion_challenges(user_id, token_hash, expires_at, delivered_at)
  values (v_user, v_hash, now() + interval '10 minutes', now())
  returning id into v_challenge;

  -- A persisted but unactivated challenge cannot be consumed.
  insert into public.account_deletion_challenges(user_id, token_hash, expires_at)
  values (v_user, repeat('9',64), now() + interval '10 minutes')
  returning id into v_auth;
  if private.consume_account_deletion_challenge(v_auth, v_user, repeat('9',64)) then
    raise exception 'Pending email challenge was accepted';
  end if;
  if not private.activate_account_deletion_challenge(v_auth, v_user) then
    raise exception 'Pending challenge activation failed';
  end if;
  if not private.activate_account_deletion_challenge(v_auth, v_user) then
    raise exception 'Idempotent activation retry was rejected';
  end if;
  if (select count(*) from public.account_deletion_challenges
      where id = v_auth and delivered_at is not null) <> 1 then
    raise exception 'Activation retry altered challenge identity';
  end if;
  if not private.consume_account_deletion_challenge(v_auth, v_user, repeat('9',64)) then
    raise exception 'Activated challenge was rejected';
  end if;

  -- Simulate provider failure followed by a failed database revocation.
  -- The persisted challenge remains pending and must be unusable.
  insert into public.account_deletion_challenges(user_id, token_hash, expires_at)
  values (v_user, repeat('8',64), now() + interval '10 minutes')
  returning id into v_auth;
  if private.consume_account_deletion_challenge(v_auth, v_user, repeat('8',64)) then
    raise exception 'Undelivered challenge was consumed after failed revocation';
  end if;
  if private.exchange_account_deletion_challenge(
    v_auth, v_user, repeat('8',64), repeat('7',64)
  ) is not null then
    raise exception 'Undelivered challenge was exchanged after failed revocation';
  end if;
  if private.activate_account_deletion_challenge(v_auth, v_other) then
    raise exception 'Wrong account activated pending challenge';
  end if;

  -- A challenge that expires before the provider responds cannot activate.
  insert into public.account_deletion_challenges(
    user_id, token_hash, created_at, expires_at
  ) values (
    v_user, repeat('6',64), now() - interval '11 minutes',
    now() - interval '1 minute'
  ) returning id into v_exchange;
  if private.activate_account_deletion_challenge(v_exchange, v_user) then
    raise exception 'Expired pending challenge was activated';
  end if;

  -- Revocation must prevent any subsequent activation or exchange.
  update public.account_deletion_challenges
  set consumed_at = clock_timestamp()
  where id = v_auth and user_id = v_user;
  if private.activate_account_deletion_challenge(v_auth, v_user) then
    raise exception 'Revoked challenge was activated';
  end if;
  if private.exchange_account_deletion_challenge(
    v_auth, v_user, repeat('8',64), repeat('7',64)
  ) is not null then
    raise exception 'Revoked challenge was exchanged';
  end if;

  if private.consume_account_deletion_challenge(v_challenge, v_other, v_hash) then
    raise exception 'Wrong-account challenge was accepted';
  end if;
  if private.consume_account_deletion_challenge(v_challenge, v_user, v_bad_hash) then
    raise exception 'Wrong token was accepted';
  end if;
  select attempts into v_attempts from public.account_deletion_challenges
  where id = v_challenge;
  if v_attempts <> 1 then
    raise exception 'Incorrect token did not increment attempt count';
  end if;

  if not private.consume_account_deletion_challenge(v_challenge, v_user, v_hash) then
    raise exception 'Valid challenge was rejected';
  end if;
  if private.consume_account_deletion_challenge(v_challenge, v_user, v_hash) then
    raise exception 'Consumed challenge was replayed';
  end if;

  insert into public.account_deletion_authorizations(
    user_id, authorization_hash, expires_at
  ) values (v_user, v_hash, now() + interval '5 minutes')
  returning id into v_auth;

  if private.consume_account_deletion_authorization(v_auth, v_other, v_hash) then
    raise exception 'Wrong-account authorization was accepted';
  end if;
  if private.consume_account_deletion_authorization(v_auth, v_user, v_bad_hash) then
    raise exception 'Wrong authorization token was accepted';
  end if;
  if not private.consume_account_deletion_authorization(v_auth, v_user, v_hash) then
    raise exception 'Valid authorization was rejected';
  end if;
  if private.consume_account_deletion_authorization(v_auth, v_user, v_hash) then
    raise exception 'Consumed authorization was replayed';
  end if;

  -- Expired challenges must fail even when the supplied hash matches.
  insert into public.account_deletion_challenges(user_id, token_hash, created_at, expires_at, delivered_at)
  values (v_user, v_hash, now() - interval '11 minutes', now() - interval '1 minute', now() - interval '10 minutes')
  returning id into v_challenge;
  if private.consume_account_deletion_challenge(v_challenge, v_user, v_hash) then
    raise exception 'Expired challenge was accepted';
  end if;

  -- Five failed attempts lock the challenge, including the correct token.
  insert into public.account_deletion_challenges(user_id, token_hash, expires_at, delivered_at)
  values (v_user, v_hash, now() + interval '10 minutes', now())
  returning id into v_challenge;
  for i in 1..5 loop
    if private.consume_account_deletion_challenge(v_challenge, v_user, v_bad_hash) then
      raise exception 'Invalid token was accepted';
    end if;
  end loop;
  select attempts into v_attempts from public.account_deletion_challenges
  where id = v_challenge;
  if v_attempts <> 5 then
    raise exception 'Challenge did not reach attempt limit';
  end if;
  if private.consume_account_deletion_challenge(v_challenge, v_user, v_hash) then
    raise exception 'Locked challenge was accepted';
  end if;

  -- Expired authorization cannot be used.
  insert into public.account_deletion_authorizations(
    user_id, authorization_hash, created_at, expires_at
  ) values (v_user, v_bad_hash, now() - interval '6 minutes', now() - interval '1 minute')
  returning id into v_auth;
  if private.consume_account_deletion_authorization(v_auth, v_user, v_bad_hash) then
    raise exception 'Expired authorization was accepted';
  end if;

  -- Malformed and absent hashes are rejected before attempting consumption.
  insert into public.account_deletion_challenges(user_id, token_hash, expires_at, delivered_at)
  values (v_user, v_hash, now() + interval '10 minutes', now())
  returning id into v_challenge;
  if private.consume_account_deletion_challenge(v_challenge, v_user, 'not-a-sha256-hash')
     or private.consume_account_deletion_challenge(v_challenge, v_user, null) then
    raise exception 'Malformed challenge hash was accepted';
  end if;
  select attempts into v_attempts from public.account_deletion_challenges
  where id = v_challenge;
  if v_attempts <> 0 then
    raise exception 'Malformed challenge hash incorrectly consumed an attempt';
  end if;

  insert into public.account_deletion_authorizations(
    user_id, authorization_hash, expires_at
  ) values (v_user, repeat('c', 64), now() + interval '5 minutes')
  returning id into v_auth;
  if private.consume_account_deletion_authorization(v_auth, v_user, 'not-a-sha256-hash')
     or private.consume_account_deletion_authorization(v_auth, v_user, null) then
    raise exception 'Malformed authorization hash was accepted';
  end if;

  -- The function independently enforces a five-minute maximum validity window.
  insert into public.account_deletion_authorizations(
    user_id, authorization_hash, expires_at
  ) values (v_user, repeat('d', 64), now() + interval '6 minutes')
  returning id into v_auth;
  if private.consume_account_deletion_authorization(v_auth, v_user, repeat('d', 64)) then
    raise exception 'Overlong authorization lifetime was accepted';
  end if;

  -- Wrong email codes must also count when submitted through the actual
  -- exchange function, not only through the lower-level consume function.
  insert into public.account_deletion_challenges(user_id, token_hash, expires_at, delivered_at)
  values (v_user, repeat('e',64), now() + interval '10 minutes', now())
  returning id into v_challenge;
  for i in 1..5 loop
    if private.exchange_account_deletion_challenge(
      v_challenge, v_user, repeat('f',64), repeat('3',64)
    ) is not null then
      raise exception 'Incorrect email code exchanged for authorization';
    end if;
  end loop;
  select attempts into v_attempts from public.account_deletion_challenges
  where id = v_challenge;
  if v_attempts <> 5 then
    raise exception 'Wrong exchange codes did not reach attempt limit';
  end if;
  if private.exchange_account_deletion_challenge(
    v_challenge, v_user, repeat('e',64), repeat('3',64)
  ) is not null then
    raise exception 'Correct email code bypassed exchange lockout';
  end if;
  if exists (
    select 1 from public.account_deletion_authorizations
    where user_id = v_user and authorization_hash = repeat('3',64)
  ) then
    raise exception 'Locked-out exchange issued an authorization';
  end if;

  -- Successful exchange consumes the challenge and issues one authorization.
  insert into public.account_deletion_challenges(user_id, token_hash, expires_at, delivered_at)
  values (v_user, repeat('1',64), now() + interval '10 minutes', now())
  returning id into v_challenge;
  v_exchange := private.exchange_account_deletion_challenge(
    v_challenge, v_user, repeat('1',64), repeat('2',64)
  );
  if v_exchange is null then
    raise exception 'Valid challenge exchange was rejected';
  end if;
  if not exists (
    select 1 from public.account_deletion_authorizations
    where id = v_exchange and user_id = v_user
      and authorization_hash = repeat('2',64) and consumed_at is null
  ) then
    raise exception 'Challenge exchange failed to issue authorization';
  end if;
  if private.exchange_account_deletion_challenge(
    v_challenge, v_user, repeat('1',64), repeat('3',64)
  ) is not null then
    raise exception 'Challenge exchange was replayed';
  end if;
  if not private.consume_account_deletion_authorization(
    v_exchange, v_user, repeat('2',64)
  ) then
    raise exception 'Exchanged authorization could not be consumed';
  end if;

  -- A uniqueness failure during issuance must roll back challenge consumption.
  -- The exception block is a PostgreSQL subtransaction, mirroring a failed
  -- application transaction while allowing subsequent assertions.
  insert into public.account_deletion_challenges(user_id, token_hash, expires_at, delivered_at)
  values (v_user, repeat('4',64), now() + interval '10 minutes', now())
  returning id into v_challenge;
  begin
    perform private.exchange_account_deletion_challenge(
      v_challenge, v_user, repeat('4',64), repeat('2',64)
    );
    raise exception 'Duplicate authorization hash unexpectedly succeeded';
  exception
    when unique_violation then
      null;
  end;
  if exists (
    select 1 from public.account_deletion_challenges
    where id = v_challenge and consumed_at is not null
  ) then
    raise exception 'Failed exchange consumed its challenge';
  end if;
  -- Retrying with a fresh authorization hash must still succeed.
  v_exchange := private.exchange_account_deletion_challenge(
    v_challenge, v_user, repeat('4',64), repeat('5',64)
  );
  if v_exchange is null then
    raise exception 'Failed exchange prevented safe retry';
  end if;

  raise notice 'PASS: binding, attempts, expiry, lockout, replay, malformed hashes, lifetime, exchange, and rollback';
end
$$;

rollback;
