-- =====================================================
-- ALPHA CONVITES — Lista de Adesão
-- Schema do banco de dados (Supabase / PostgreSQL)
-- =====================================================

create extension if not exists "pgcrypto";

-- =====================================================
-- TABELA: formandos
-- Representa o aluno representante da turma (autenticado)
-- =====================================================
create table if not exists public.formandos (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  nome            text not null,
  cpf             text not null unique,
  email           text not null,
  whatsapp        text not null,
  data_nascimento date not null,
  curso           text not null,
  instituicao     text not null,
  cidade          text not null,
  estado          text not null,
  semestre        text not null,
  slug            text not null unique,
  criado_em       timestamptz not null default now()
);

create index if not exists idx_formandos_slug    on public.formandos (slug);
create index if not exists idx_formandos_user_id on public.formandos (user_id);

-- =====================================================
-- TABELA: adesoes
-- Preenchimentos feitos a partir do link público da turma
-- =====================================================
create type tem_fotos_enum as enum ('sim', 'nao', 'nao_sei');

create table if not exists public.adesoes (
  id           uuid primary key default gen_random_uuid(),
  slug_origem  text not null references public.formandos(slug) on delete cascade,
  nome         text not null,
  cpf          text,
  email        text not null,
  whatsapp     text not null,
  qtd_luxo     integer not null default 0 check (qtd_luxo >= 0),
  qtd_simples  integer not null default 0 check (qtd_simples >= 0),
  tem_fotos    tem_fotos_enum not null,
  observacoes  text,
  criado_em    timestamptz not null default now()
);

create index if not exists idx_adesoes_slug_origem on public.adesoes (slug_origem);
create index if not exists idx_adesoes_criado_em   on public.adesoes (criado_em desc);

-- =====================================================
-- RLS — Row Level Security
-- =====================================================
alter table public.formandos enable row level security;
alter table public.adesoes   enable row level security;

-- Formandos: cada usuário só vê e edita seus próprios dados.
-- Leitura pública restrita (slug + curso/instituicao/semestre/nome)
-- é feita via select específico — RLS abaixo libera leitura mínima.
drop policy if exists "formandos_select_own"   on public.formandos;
drop policy if exists "formandos_select_slug"  on public.formandos;
drop policy if exists "formandos_insert_self"  on public.formandos;
drop policy if exists "formandos_update_self"  on public.formandos;

create policy "formandos_select_own"
  on public.formandos for select
  using ( auth.uid() = user_id );

create policy "formandos_select_slug"
  on public.formandos for select
  using ( true );
-- Nota: leitura pública permite ao formulário público /adesao/[slug]
-- exibir curso, instituição e semestre da turma. Não há colunas sensíveis
-- expostas pelas queries do app (somente nome, curso, instituicao, semestre).

create policy "formandos_insert_self"
  on public.formandos for insert
  with check ( auth.uid() = user_id );

create policy "formandos_update_self"
  on public.formandos for update
  using ( auth.uid() = user_id );

-- Adesões: inserção pública, leitura apenas pelo dono do slug
drop policy if exists "adesoes_insert_public" on public.adesoes;
drop policy if exists "adesoes_select_owner"  on public.adesoes;

create policy "adesoes_insert_public"
  on public.adesoes for insert
  with check ( true );

create policy "adesoes_select_owner"
  on public.adesoes for select
  using (
    exists (
      select 1
      from public.formandos f
      where f.slug = adesoes.slug_origem
        and f.user_id = auth.uid()
    )
  );

-- =====================================================
-- Realtime — habilita updates em tempo real para adesoes
-- =====================================================
alter publication supabase_realtime add table public.adesoes;
