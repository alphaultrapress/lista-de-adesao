-- =====================================================
-- Adiciona estado (UF) e cidade em representatives.
-- O formulário de cadastro já coleta esses dados; agora são persistidos.
-- Idempotente.
-- =====================================================

alter table public.representatives
  add column if not exists state text;

alter table public.representatives
  add column if not exists city text;
