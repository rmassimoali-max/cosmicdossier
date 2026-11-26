-- REVIEW-ONLY SQL. Do not run on production until explicitly approved.
-- Cosmic Dossier: account-owned assessment snapshots, version 1.
-- No service-role access or unauthenticated access is needed by the app.
begin;

create table if not exists public.saved_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_slug text not null,
  display_label text,
  result_version integer not null default 1,
  scores jsonb not null,
  dossier_patch jsonb not null,
  source_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_assessments_slug_check
    check (assessment_slug in (
      'big-five', 'mbti', 'enneagram', 'hexaco', 'attachment-style',
      'love-styles', 'dark-triad', 'highly-sensitive-person',
      'emotional-intelligence', 'resilience', 'adhd-traits',
      'autism-quotient'
    )),
  constraint saved_assessments_version_check check (result_version = 1),
  constraint saved_assessments_label_check
    check (display_label is null or char_length(display_label) <= 100),
  constraint saved_assessments_source_check
    check (source_label is null or char_length(source_label) <= 160),
  constraint saved_assessments_scores_shape_check
    check (jsonb_typeof(scores) = 'object' and pg_column_size(scores) <= 8192),
  constraint saved_assessments_patch_shape_check
    check (jsonb_typeof(dossier_patch) = 'object' and pg_column_size(dossier_patch) <= 16384)
);

create index if not exists saved_assessments_owner_recent_idx
  on public.saved_assessments (user_id, created_at desc);

alter table public.saved_assessments enable row level security;

-- Revoke any automatic public-schema grants before permitting authenticated access.
revoke all on table public.saved_assessments from public, anon;
grant select, insert, update, delete on table public.saved_assessments to authenticated;

create policy "saved_assessments_select_own"
  on public.saved_assessments for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "saved_assessments_insert_own"
  on public.saved_assessments for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "saved_assessments_update_own"
  on public.saved_assessments for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "saved_assessments_delete_own"
  on public.saved_assessments for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
