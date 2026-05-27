-- =====================================================
-- Marca quando a turma foi atendida (consultor já entrou em contato).
-- Usado no painel admin para diferenciar turmas com meta atingida
-- mas ainda nao contactadas vs ja atendidas.
-- =====================================================

alter table public.representatives
  add column if not exists contacted_at timestamptz;

create index if not exists idx_representatives_contacted_at
  on public.representatives (contacted_at);

-- Permite que admins atualizem qualquer representante
drop policy if exists "representatives_update_admin" on public.representatives;
create policy "representatives_update_admin"
  on public.representatives for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
