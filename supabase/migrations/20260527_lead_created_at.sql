-- =====================================================
-- Marca quando o Lead foi criado no Bitrix para a turma.
-- Evita criar leads duplicados e permite mostrar status no admin.
-- =====================================================

alter table public.representatives
  add column if not exists lead_created_at timestamptz;
