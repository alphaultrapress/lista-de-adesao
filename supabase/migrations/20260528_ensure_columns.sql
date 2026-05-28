-- =====================================================
-- Garante todas as colunas usadas pela aplicacao em representatives.
-- Idempotente: roda sem erro mesmo se as colunas ja existirem.
-- =====================================================

alter table public.representatives
  add column if not exists consultant_name text;

alter table public.representatives
  add column if not exists consultant_phone text;

alter table public.representatives
  add column if not exists meta_notified_at timestamptz;

alter table public.representatives
  add column if not exists contacted_at timestamptz;

alter table public.representatives
  add column if not exists lead_created_at timestamptz;

-- Policy para admins atualizarem (marcar atendido / lead)
drop policy if exists "representatives_update_admin" on public.representatives;
create policy "representatives_update_admin"
  on public.representatives for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
