-- Migration: Fix usage_counters RLS
-- Sprint 16 — Deploy funcional
-- Remove overly permissive policy and restrict to select-only for users.
-- Backend uses service_role key which bypasses RLS, so no insert/update policy needed.

drop policy if exists "Service can manage usage" on usage_counters;

drop policy if exists "Users can read own usage" on usage_counters;

create policy "Users can read own usage"
  on usage_counters for select
  using (auth.uid() = user_id);
