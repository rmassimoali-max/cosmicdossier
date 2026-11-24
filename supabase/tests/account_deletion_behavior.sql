-- Behavioral tests run only in the disposable CI PostgreSQL database.
-- Transaction rollback ensures test records are never retained.
begin;

do $$
declare
  v_user uuid := '11111111-1111-4111-8111-111111111111';
  v_other uuid := '22222222-2222-4222-8222-222222222222';
  v_challenge uuid;
  v_auth uuid;
  v_hash text := repeat('a', 64);
  v_bad_hash text := repeat('b', 64);
  v_attempts integer;
begin
  insert into auth.users(id) values (v_user), (v_other);
  insert into public.account_deletion_challenges(user_id, token_hash, expires_at)
  values (v_user, v_hash, now() + interval '10 minutes')
  returning id into v_challenge;

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

  raise notice 'PASS: account binding, failed attempts, valid consumption, and replay guards';
end
$$;

rollback;
