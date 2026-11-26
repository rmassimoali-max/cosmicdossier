begin;
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'private.deletion_session_authorizations'::regclass) then
    raise exception 'Session storage RLS disabled';
  end if;
  for i in 1..3 loop
    if has_table_privilege((array['anon','authenticated','service_role'])[i], 'private.deletion_session_authorizations', 'SELECT,INSERT,UPDATE,DELETE')
       or has_function_privilege((array['anon','authenticated','service_role'])[i], 'private.put_deletion_session_authorization(text,text,integer)', 'EXECUTE')
       or has_function_privilege((array['anon','authenticated','service_role'])[i], 'private.take_deletion_session_authorization(text)', 'EXECUTE') then
      raise exception 'Unexpected client storage access';
    end if;
  end loop;
end;
$$;
set local role deletion_backend;
do $$
declare
  a text := repeat('a',64);
  b text := repeat('b',64);
begin
  if not private.put_deletion_session_authorization(a,'encrypted-a',240000)
     or not private.put_deletion_session_authorization(b,'encrypted-b',240000) then
    raise exception 'Storage failed';
  end if;
  if private.put_deletion_session_authorization(a,'bad',240001)
     or private.put_deletion_session_authorization('bad','bad',1000) then
    raise exception 'Invalid input accepted';
  end if;
  if private.take_deletion_session_authorization(a) is distinct from 'encrypted-a'
     or private.take_deletion_session_authorization(a) is not null then
    raise exception 'Single use failed';
  end if;
  if private.take_deletion_session_authorization(b) is distinct from 'encrypted-b' then
    raise exception 'Slot isolation failed';
  end if;
  if not private.put_deletion_session_authorization(a,'expired',240000) then
    raise exception 'Expiry fixture failed';
  end if;
  update private.deletion_session_authorizations set expires_at = clock_timestamp() - interval '1 second' where slot = a;
  if private.take_deletion_session_authorization(a) is not null then
    raise exception 'Expired authorization returned';
  end if;
end;
$$;
do $$
declare
  a text := repeat('a',64);
  b text := repeat('b',64);
begin
  perform private.put_deletion_session_authorization(a,'expired',240000);
  update private.deletion_session_authorizations set expires_at = clock_timestamp() - interval '1 second' where slot = a;
  perform private.put_deletion_session_authorization(b,'live',240000);
  if exists (select 1 from private.deletion_session_authorizations where slot = a) then
    raise exception 'Expired storage not pruned';
  end if;
  if private.take_deletion_session_authorization(b) is distinct from 'live' then
    raise exception 'Cleanup removed live storage';
  end if;
end;
$$;
reset role;
do $$
begin
  if has_function_privilege('anon','private.prune_deletion_session_authorizations()','EXECUTE')
     or has_function_privilege('authenticated','private.prune_deletion_session_authorizations()','EXECUTE')
     or has_function_privilege('service_role','private.prune_deletion_session_authorizations()','EXECUTE') then
    raise exception 'Unexpected cleanup permission';
  end if;
end;
$$;
rollback;
