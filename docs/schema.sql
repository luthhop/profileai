-- ============================================================
-- ProfileAI — Schema Supabase
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- ------------------------------------------------------------
-- TABELA: profiles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                  TEXT,
  area                  TEXT,
  cargo                 TEXT,
  stack                 TEXT[],
  experiencias          JSONB,
  formacao              TEXT,
  habilidades           TEXT[],
  objetivo_profissional TEXT,
  nivel_ingles          TEXT,

  -- Dados pessoais (Perfil completo)
  cidade                TEXT,
  estado                TEXT,
  telefone              TEXT,
  email_contato         TEXT,
  linkedin_url          TEXT,
  github_url            TEXT,
  portfolio_url         TEXT,
  idiomas               JSONB       DEFAULT '[]'::JSONB,
  foto_url              TEXT,

  -- Objetivo profissional detalhado
  cargo_desejado        TEXT,
  area_desejada         TEXT,
  senioridade           TEXT,
  pretensao_salarial    TEXT,
  modelo_trabalho       TEXT,
  disponivel_relocar    BOOLEAN     DEFAULT FALSE,
  tipo_empresa          TEXT,
  data_disponivel       TEXT,

  -- Listas dinâmicas (JSONB arrays)
  experiencias_detalhadas JSONB     DEFAULT '[]'::JSONB,
  formacoes               JSONB     DEFAULT '[]'::JSONB,
  certificacoes           JSONB     DEFAULT '[]'::JSONB,
  projetos_pessoais       JSONB     DEFAULT '[]'::JSONB,

  -- Habilidades categorizadas
  habilidades_detalhadas  JSONB     DEFAULT '{"tecnicas":[],"comportamentais":[],"ferramentas":[],"metodologias":[]}'::JSONB,

  -- Informações extras
  extras                  JSONB     DEFAULT '{"resumo":"","conquistas":"","publicacoes":"","voluntariado":"","hobbies":""}'::JSONB,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABELA: linkedin_outputs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.linkedin_outputs (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  headline   VARCHAR(120),
  about      TEXT,
  keywords   TEXT[],
  dicas      TEXT[],
  vaga_alvo  TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABELA: vagas_salvas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vagas_salvas (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vaga_titulo  TEXT,
  vaga_empresa TEXT,
  vaga_url     TEXT,
  match_score  INTEGER     CHECK (match_score BETWEEN 0 AND 100),
  status       TEXT        CHECK (status IN ('salva', 'candidatado', 'descartada')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TRIGGER: atualiza updated_at em profiles automaticamente
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- RLS: Row Level Security em todas as tabelas
-- ------------------------------------------------------------
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas_salvas     ENABLE ROW LEVEL SECURITY;

-- Cada usuário acessa apenas seus próprios registros

DROP POLICY IF EXISTS "profiles_own_user"         ON public.profiles;
DROP POLICY IF EXISTS "linkedin_outputs_own_user" ON public.linkedin_outputs;
DROP POLICY IF EXISTS "vagas_salvas_own_user"     ON public.vagas_salvas;

CREATE POLICY "profiles_own_user"
  ON public.profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "linkedin_outputs_own_user"
  ON public.linkedin_outputs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vagas_salvas_own_user"
  ON public.vagas_salvas
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
