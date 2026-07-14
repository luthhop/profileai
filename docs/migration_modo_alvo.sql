-- ============================================================
-- ProfileAI — Migration: Modo Alvo (LinkedIn Coach)
-- Adiciona coluna vaga_alvo à tabela linkedin_outputs
-- para identificar otimizações geradas para vagas específicas.
-- Execute no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.linkedin_outputs ADD COLUMN IF NOT EXISTS vaga_alvo TEXT;
