-- =====================================================
-- RESET COMPLETO + GARANTIA DE SCHEMA
-- ATENCAO: IRREVERSIVEL. Roda manualmente no SQL Editor do Supabase.
-- Mantem apenas o admin alphaconvites@adm.com.
-- =====================================================

-- 1) Garante todas as colunas usadas pela aplicacao (idempotente)
alter table public.students
  add column if not exists qtd_convites integer not null default 1;
alter table public.students
  alter column birth_date drop not null;

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

-- 2) Garante policies de update/delete (idempotente)
drop policy if exists "students_update_owner_or_admin" on public.students;
create policy "students_update_owner_or_admin"
  on public.students for update
  to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.representatives r
      where r.id = students.representative_id and r.user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.representatives r
      where r.id = students.representative_id and r.user_id = auth.uid())
  );

drop policy if exists "students_delete_owner_or_admin" on public.students;
create policy "students_delete_owner_or_admin"
  on public.students for delete
  to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.representatives r
      where r.id = students.representative_id and r.user_id = auth.uid())
  );

drop policy if exists "representatives_update_admin" on public.representatives;
create policy "representatives_update_admin"
  on public.representatives for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================
-- 3) RESET DOS DADOS
-- =====================================================
delete from public.students;

do $$
begin
  if to_regclass('public.adesoes') is not null then
    execute 'delete from public.adesoes';
  end if;
end $$;

delete from public.representatives;

do $$
begin
  if to_regclass('public.formandos') is not null then
    execute 'delete from public.formandos';
  end if;
end $$;

-- Remove todos os usuarios exceto o admin
delete from auth.users
where lower(email) <> lower('alphaconvites@adm.com');

-- Garante que o admin esteja registrado na tabela admins
insert into public.admins (user_id, email)
select id, lower(email)
from auth.users
where lower(email) = lower('alphaconvites@adm.com')
on conflict (user_id) do update set email = excluded.email;

-- 4) Confirma o estado final
select
  (select count(*) from public.students) as students,
  (select count(*) from public.representatives) as representatives,
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.admins) as admins;
