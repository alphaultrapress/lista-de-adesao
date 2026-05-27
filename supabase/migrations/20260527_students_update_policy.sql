-- =====================================================
-- Permite que o representante (dono da turma) atualize as
-- proprias linhas em students. Sem isso, o RLS bloqueia
-- silenciosamente o UPDATE de qtd_convites no dashboard.
-- =====================================================

drop policy if exists "students_update_owner_or_admin" on public.students;

create policy "students_update_owner_or_admin"
  on public.students for update
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.representatives r
      where r.id = students.representative_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.representatives r
      where r.id = students.representative_id
        and r.user_id = auth.uid()
    )
  );
