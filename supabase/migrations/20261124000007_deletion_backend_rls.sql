-- Staged only. The dedicated NOLOGIN role must pass RLS to operate.
-- This role is server-only and cannot authenticate or delete accounts.
create policy deletion_backend_challenges_select
  on public.account_deletion_challenges for select
  to deletion_backend using (true);
create policy deletion_backend_challenges_insert
  on public.account_deletion_challenges for insert
  to deletion_backend with check (true);
create policy deletion_backend_challenges_update
  on public.account_deletion_challenges for update
  to deletion_backend using (true) with check (true);

create policy deletion_backend_authorizations_select
  on public.account_deletion_authorizations for select
  to deletion_backend using (true);
create policy deletion_backend_authorizations_insert
  on public.account_deletion_authorizations for insert
  to deletion_backend with check (true);
create policy deletion_backend_authorizations_update
  on public.account_deletion_authorizations for update
  to deletion_backend using (true) with check (true);

-- No policies for anon/authenticated; no DELETE policies for any role.
