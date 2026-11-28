-- Account deletion verification storage (staged only; do not apply to production yet).
-- No client-facing RLS policies. Server-only privileged access is required.
create table if not exists public.account_deletion_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null default 'account_deletion' check (purpose = 'account_deletion'),
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  consumed_at timestamptz,
  constraint deletion_challenge_expiry check (expires_at > created_at)
);

create index if not exists account_deletion_challenges_user_idx
  on public.account_deletion_challenges (user_id, expires_at desc);

create table if not exists public.account_deletion_authorizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  authorization_hash text not null unique check (authorization_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  constraint deletion_authorization_expiry check (expires_at > created_at)
);

create index if not exists account_deletion_authorizations_user_idx
  on public.account_deletion_authorizations (user_id, expires_at desc);

alter table public.account_deletion_challenges enable row level security;
alter table public.account_deletion_authorizations enable row level security;

-- Explicitly block client roles, including future grants made via default privileges.
revoke all on table public.account_deletion_challenges from public, anon, authenticated;
revoke all on table public.account_deletion_authorizations from public, anon, authenticated;

comment on table public.account_deletion_challenges is
  'Server-only deletion challenges; never expose hashes or rows to browser clients.';
comment on table public.account_deletion_authorizations is
  'Server-only single-use deletion authorization records.';

-- IMPORTANT: This migration does not grant a deletion capability or provide an
-- atomic consume function. Future code must consume records using an atomic
-- conditional UPDATE ... WHERE consumed_at IS NULL AND expires_at > now()
-- and check the affected row count within a transaction.
