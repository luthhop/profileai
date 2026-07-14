-- ============================================================
-- ProfileAI — Migration: Perfil Completo
-- Execute no SQL Editor do Supabase para adicionar as colunas
-- novas à tabela profiles existente.
-- ============================================================

-- Dados pessoais
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cidade             TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estado             TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefone           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_contato      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url         TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_url      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS idiomas            JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS foto_url           TEXT;

-- Objetivo profissional detalhado
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cargo_desejado     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area_desejada      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS senioridade        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pretensao_salarial TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS modelo_trabalho    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disponivel_relocar BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo_empresa       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_disponivel    TEXT;

-- Listas dinâmicas (JSONB arrays)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experiencias_detalhadas JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS formacoes               JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certificacoes           JSONB DEFAULT '[]'::JSONB;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS projetos_pessoais       JSONB DEFAULT '[]'::JSONB;

-- Habilidades categorizadas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS habilidades_detalhadas JSONB DEFAULT '{"tecnicas":[],"comportamentais":[],"ferramentas":[],"metodologias":[]}'::JSONB;

-- Informações extras
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '{"resumo":"","conquistas":"","publicacoes":"","voluntariado":"","hobbies":""}'::JSONB;
