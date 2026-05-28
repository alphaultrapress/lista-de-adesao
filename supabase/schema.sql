-- =====================================================
-- ALPHA CONVITES - Lista de Adesao
-- Supabase / PostgreSQL
-- =====================================================

create extension if not exists "pgcrypto";

-- =====================================================
-- TABLE: representatives
-- Authenticated class representatives.
-- =====================================================
create table if not exists public.representatives (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  name              text not null,
  email             text not null,
  course_name       text not null,
  institution_name  text not null,
  graduation_year   text not null,
  slug              text not null unique,
  consultant_name   text,
  consultant_phone  text,
  meta_notified_at  timestamptz,
  contacted_at      timestamptz,
  lead_created_at   timestamptz,
  created_at        timestamptz not null default now()
);

alter table public.representatives
  add column if not exists meta_notified_at timestamptz;

alter table public.representatives
  add column if not exists contacted_at timestamptz;

alter table public.representatives
  add column if not exists lead_created_at timestamptz;

alter table public.representatives
  add column if not exists consultant_name text;

alter table public.representatives
  add column if not exists consultant_phone text;

create index if not exists idx_representatives_user_id
  on public.representatives (user_id);
create index if not exists idx_representatives_slug
  on public.representatives (slug);
create index if not exists idx_representatives_course_name
  on public.representatives (course_name);
create index if not exists idx_representatives_institution_name
  on public.representatives (institution_name);

-- =====================================================
-- TABLE: students
-- Public form submissions from a representative link.
-- =====================================================
create table if not exists public.students (
  id                 uuid primary key default gen_random_uuid(),
  representative_id  uuid not null references public.representatives(id) on delete cascade,
  cpf                text not null,
  full_name          text not null,
  birth_date         date not null,
  phone              text not null,
  email              text not null,
  qtd_convites       integer not null default 1 check (qtd_convites >= 0),
  created_at         timestamptz not null default now(),
  constraint students_unique_cpf_per_representative unique (representative_id, cpf)
);

alter table public.students
  add column if not exists qtd_convites integer not null default 1;

create index if not exists idx_students_representative_id
  on public.students (representative_id);
create index if not exists idx_students_created_at
  on public.students (created_at desc);
create index if not exists idx_students_full_name
  on public.students (full_name);

-- =====================================================
-- TABLE: admins
-- Authenticated administrative users.
-- =====================================================
create table if not exists public.admins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  email       text not null unique,
  created_at  timestamptz not null default now()
);

create index if not exists idx_admins_user_id
  on public.admins (user_id);

-- =====================================================
-- Compatibility migration from old tables, if they exist.
-- This keeps current data while the app moves to the new names.
-- =====================================================
do $$
begin
  if to_regclass('public.formandos') is not null then
    execute $sql$
      insert into public.representatives (
        id,
        user_id,
        name,
        email,
        course_name,
        institution_name,
        graduation_year,
        slug,
        created_at
      )
      select
        id,
        user_id,
        nome,
        email,
        curso,
        instituicao,
        semestre,
        slug,
        criado_em
      from public.formandos
      on conflict (slug) do update set
        user_id = excluded.user_id,
        name = excluded.name,
        email = excluded.email,
        course_name = excluded.course_name,
        institution_name = excluded.institution_name,
        graduation_year = excluded.graduation_year
    $sql$;
  end if;

  if to_regclass('public.adesoes') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'adesoes'
        and column_name = 'data_nascimento'
    )
  then
    execute $sql$
      insert into public.students (
        id,
        representative_id,
        cpf,
        full_name,
        birth_date,
        phone,
        email,
        created_at
      )
      select distinct on (r.id, regexp_replace(coalesce(a.cpf, ''), '\D', '', 'g'))
        a.id,
        r.id,
        regexp_replace(a.cpf, '\D', '', 'g'),
        a.nome,
        a.data_nascimento,
        a.whatsapp,
        a.email,
        a.criado_em
      from public.adesoes a
      join public.representatives r on r.slug = a.slug_origem
      where a.cpf is not null
        and regexp_replace(a.cpf, '\D', '', 'g') <> ''
        and a.data_nascimento is not null
      order by r.id, regexp_replace(coalesce(a.cpf, ''), '\D', '', 'g'), a.criado_em asc
      on conflict on constraint students_unique_cpf_per_representative do nothing
    $sql$;
  end if;
end $$;

-- =====================================================
-- Helpers
-- =====================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.get_representative_by_slug(p_slug text)
returns table (
  id uuid,
  name text,
  course_name text,
  institution_name text,
  graduation_year text,
  slug text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.name,
    r.course_name,
    r.institution_name,
    r.graduation_year,
    r.slug
  from public.representatives r
  where r.slug = p_slug
  limit 1;
$$;

revoke all on function public.get_representative_by_slug(text) from public;
grant execute on function public.get_representative_by_slug(text) to anon, authenticated;

create or replace function public.representative_exists(p_representative_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.representatives r
    where r.id = p_representative_id
  );
$$;

revoke all on function public.representative_exists(uuid) from public;
grant execute on function public.representative_exists(uuid) to anon, authenticated;

create or replace function public.register_default_admin()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if lower(new.email) = lower('alphaconvites@adm.com') then
    insert into public.admins (user_id, email)
    values (new.id, lower(new.email))
    on conflict (user_id) do update set email = excluded.email;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_register_default_admin on auth.users;

create trigger on_auth_user_register_default_admin
after insert or update of email on auth.users
for each row
execute function public.register_default_admin();

insert into public.admins (user_id, email)
select id, lower(email)
from auth.users
where lower(email) = lower('alphaconvites@adm.com')
on conflict (user_id) do update set email = excluded.email;

-- =====================================================
-- RLS
-- =====================================================
alter table public.representatives enable row level security;
alter table public.students enable row level security;
alter table public.admins enable row level security;

drop policy if exists "representatives_select_own_or_admin" on public.representatives;
drop policy if exists "representatives_insert_own" on public.representatives;
drop policy if exists "representatives_update_own" on public.representatives;

create policy "representatives_select_own_or_admin"
  on public.representatives for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "representatives_insert_own"
  on public.representatives for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "representatives_update_own"
  on public.representatives for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "representatives_update_admin" on public.representatives;
create policy "representatives_update_admin"
  on public.representatives for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "students_insert_public" on public.students;
drop policy if exists "students_select_owner_or_admin" on public.students;

create policy "students_insert_public"
  on public.students for insert
  to anon, authenticated
  with check (public.representative_exists(representative_id));

create policy "students_select_owner_or_admin"
  on public.students for select
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

drop policy if exists "admins_select_own_or_admin" on public.admins;

create policy "admins_select_own_or_admin"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- =====================================================
-- Realtime
-- =====================================================
do $$
begin
  alter publication supabase_realtime add table public.students;
exception
  when duplicate_object then null;
end $$;
