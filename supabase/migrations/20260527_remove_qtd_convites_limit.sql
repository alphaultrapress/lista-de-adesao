-- =====================================================
-- Remove o limite máximo de 50 convites por aluno.
-- Agora cada aluno/representante pode pedir qualquer quantidade (>= 0).
-- =====================================================

do $$
declare
  c text;
begin
  -- Localiza o nome do check constraint atual e dropa
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.students'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%qtd_convites%'
  loop
    execute format('alter table public.students drop constraint %I', c);
  end loop;
end $$;

-- Recria com restrição apenas de não-negativo
alter table public.students
  add constraint students_qtd_convites_nonneg check (qtd_convites >= 0);
