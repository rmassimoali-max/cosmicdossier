# Phase 2: Saved Assessments (implementation and safety contract)

Status: design checkpoint. **No database migration has been applied.** Owner chose existing Supabase Free project instead of paid staging. Build and review the migration and server functions in this GitHub branch; do not execute the production migration until the owner approves a separate production-schema checkpoint. Preview and production share one Supabase project, so preview tests may affect real database rows once the schema is enabled.

## Existing behavior (preserve)
- Tests score locally and can be used without signing in.
- The user explicitly selects "Add to Dossier" to update the browser-local PersonInput.
- Local session is stored under `cosmic-dossier-v1`.
- Two-person dossiers are supported.
- Stripe unlocks and report generation remain unchanged.

## First release contract
- Saving is optional, signed-in only, and explicitly initiated by the user.
- Each saved assessment is owned by the authenticated Supabase Auth user.
- The user can list, restore, and delete their own saved assessments.
- Never automatically upload all localStorage state, birth details, raw answers, or another person's profile.
- Only allow recognized assessment slugs, bounded numeric score values, and versioned JSON payloads.
- Store the source label, assessment slug, scores/dossier patch, created/updated timestamps, and optional user-chosen display label.
- Avoid accidental cross-device overwrites: require an explicit selection on restore, and make conflicts visible.
- No server-side diagnostic inference or new paywall.
- Signed-out users continue with the existing browser-only workflow.

## Proposed schema (review in isolated staging first)
A `public.saved_assessments` table with:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `assessment_slug text not null`
- `display_label text`
- `result_version integer not null default 1`
- `scores jsonb not null`
- `dossier_patch jsonb not null`
- `source_label text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Enable RLS before any API grants. Allow `authenticated` users SELECT/INSERT/UPDATE/DELETE only when `(select auth.uid()) = user_id`. For UPDATE use both USING and WITH CHECK. Do not grant access to `anon`. Explicitly grant the required table privileges to `authenticated` because new tables may not be automatically exposed to the Data API. Validate payload shapes and size in the server action, not just the browser. Limit or prohibit changing `user_id` and use immutable owner IDs in application code.

## Server API
Implement TanStack server functions using the existing HttpOnly auth cookies and Supabase public REST API with the *user's* JWT (never a service-role key). Verify the session via the Auth user endpoint, including refresh handling, before writing. RLS is the final access boundary.

- `listSavedAssessments`: list only caller-owned rows.
- `saveAssessment`: validate slug, scores, patch and owner; insert a new versioned row.
- `restoreAssessment`: fetch by row ID and verify owner via RLS; merge selected result into the appropriate local person only on explicit confirmation.
- `deleteSavedAssessment`: delete only caller-owned row.

## Staging security tests
1. Anonymous users cannot read/write rows.
2. User A cannot list/read/modify/delete User B's rows, even with a guessed UUID.
3. User A cannot insert a row with User B's user_id or change ownership on update.
4. User A can create, list, restore, and delete their own results.
5. Malformed, oversized, unknown-test, and nonfinite scores are rejected.
6. Local-only assessments and existing reports still work while signed out.
7. A failed cloud save never deletes or overwrites local data.
8. Refresh, logout, and switching between two accounts never leak saved results.

## Deployment sequence
1. Implement schema, API, validation and UI on this GitHub branch without executing production SQL.
2. Review the additive schema and RLS policies, and run static/unit checks. Test SQL locally if practical; do not require paid Supabase branching.
3. Ask the owner for explicit approval of the production schema change; apply only the reviewed additive migration to the existing Free project and run RLS cross-account tests with test users.
4. Enable the cloud-save feature in a draft PR and run preview checks. Preview and production share the database, so test only dedicated test accounts and avoid destructive fixtures.
5. Merge only with explicit owner approval and successful checks.

Reference: https://supabase.com/docs/guides/api/securing-your-api
