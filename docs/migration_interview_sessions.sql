-- Migration: Interview sessions
-- Sprint 17 — Migrar histórico de entrevistas de localStorage para Supabase

create table if not exists interview_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  vaga text,
  messages_count integer not null default 0,
  score integer,
  created_at timestamptz default now()
);

alter table interview_sessions enable row level security;

create policy "Users can read own sessions"
  on interview_sessions for select
  using (auth.uid() = user_id);

create index idx_interview_sessions_user on interview_sessions(user_id, created_at desc);
