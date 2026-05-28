-- =====================================================
-- Permite que o representante (dono da turma) ou admin remova
-- alunos da propria lista de adesoes.
-- =====================================================

drop policy if exists "students_delete_owner_or_admin" on public.students;

create policy "students_delete_owner_or_admin"
  on public.students for delete
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.representatives r
      where r.id = students.representative_id
        and r.user_id = auth.uid()
    )
  );
