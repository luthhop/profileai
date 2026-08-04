-- Migration: Transactional account deletion function
-- Sprint 17 — Tornar exclusão de conta transacional

create or replace function delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from interview_sessions where user_id = target_user_id;
  delete from usage_counters where user_id = target_user_id;
  delete from candidaturas where user_id = target_user_id;
  delete from vagas_salvas where user_id = target_user_id;
  delete from linkedin_outputs where user_id = target_user_id;
  delete from subscriptions where user_id = target_user_id;
  delete from profiles where user_id = target_user_id;
end;
$$;
