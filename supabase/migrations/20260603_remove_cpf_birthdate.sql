-- =====================================================
-- Remove obrigatoriedade de CPF e data de nascimento em students
-- CPF e nascimento sairam dos formularios (representante e convidado).
-- Idempotente. Roda manualmente no SQL Editor do Supabase.
-- =====================================================

-- 1) Remove a constraint de CPF unico por representante
alter table public.students
  drop constraint if exists students_unique_cpf_per_representative;

-- 2) Torna cpf e birth_date opcionais
alter table public.students
  alter column cpf drop not null;
alter table public.students
  alter column birth_date drop not null;
