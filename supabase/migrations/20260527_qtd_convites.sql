-- =====================================================
-- Adiciona quantidade de convites desejada por aluno
-- Meta de 30 convites por turma para acionar comercial
-- =====================================================

alter table public.students
  add column if not exists qtd_convites integer not null default 1
    check (qtd_convites >= 0 and qtd_convites <= 50);

-- birth_date agora é preenchida automaticamente pela API de CPF;
-- aluno não vê mais o campo no formulário, então pode vir null.
alter table public.students
  alter column birth_date drop not null;

create index if not exists idx_students_qtd_convites
  on public.students (representative_id, qtd_convites);

-- Tabela legacy: mantém compatibilidade caso ainda esteja em uso
do $$
begin
  if to_regclass('public.adesoes') is not null then
    execute $sql$
      alter table public.adesoes
        add column if not exists qtd_convites integer not null default 1
    $sql$;
  end if;
end $$;

-- =====================================================
-- Marca quando o webhook de meta atingida (30 convites) ja foi disparado
-- para nao notificar mais de uma vez por turma
-- =====================================================
alter table public.representatives
  add column if not exists meta_notified_at timestamptz;

create index if not exists idx_representatives_meta_notified_at
  on public.representatives (meta_notified_at);
