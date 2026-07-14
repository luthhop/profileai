-- Migration: Tracker de candidaturas
-- Sprint 12

create table if not exists candidaturas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  vaga_titulo text not null,
  vaga_empresa text,
  vaga_url text,
  match_score integer,
  status text not null default 'salva' check (status in ('salva', 'aplicada', 'entrevista', 'oferta', 'rejeitada')),
  data_aplicacao timestamptz,
  notas text,
  created_at timestamptz default now()
);

alter table candidaturas enable row level security;

create policy "Users can read own candidaturas"
  on candidaturas for select
  using (auth.uid() = user_id);

create policy "Users can insert own candidaturas"
  on candidaturas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own candidaturas"
  on candidaturas for update
  using (auth.uid() = user_id);

create policy "Users can delete own candidaturas"
  on candidaturas for delete
  using (auth.uid() = user_id);

create index idx_candidaturas_user_id on candidaturas(user_id);
create index idx_candidaturas_status on candidaturas(status);
