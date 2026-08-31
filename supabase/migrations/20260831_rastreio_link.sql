-- =====================================================================
-- RASTREIO DO LINK DA TURMA
-- ---------------------------------------------------------------------
-- Uma linha por evento do ciclo do link: o representante enviou, alguém
-- abriu a página, alguém preencheu o formulário.
--
-- Por que uma tabela genérica de eventos e não colunas de contador em
-- `representatives`: contador só responde "quantos". O painel precisa de
-- "quando", "por qual canal" e "essa mesma pessoa voltou?" — e isso só
-- existe guardando o evento inteiro.
--
-- O `visitor_id` é um id aleatório gravado no navegador de quem abre a
-- página. Não identifica ninguém: serve para separar "10 visitas" de
-- "10 pessoas" e para saber se quem visitou chegou a se cadastrar.
-- =====================================================================

create table if not exists public.link_events (
  id                uuid primary key default gen_random_uuid(),
  representative_id uuid not null references public.representatives(id) on delete cascade,
  -- 'envio_whatsapp' | 'envio_copia' | 'envio_cartaz' | 'visita' | 'cadastro'
  tipo              text not null,
  -- Só nos eventos de quem abre a página (visita/cadastro).
  visitor_id        text,
  -- De onde a visita veio: 'whatsapp', 'instagram', 'direto'...
  origem            text,
  -- 'celular' | 'computador'
  dispositivo       text,
  created_at        timestamptz not null default now()
);

-- A consulta do painel é sempre "todos os eventos dessa turma, do mais
-- novo para o mais velho".
create index if not exists idx_link_events_rep
  on public.link_events (representative_id, created_at desc);

-- Usado para cruzar visita x cadastro do mesmo navegador.
create index if not exists idx_link_events_visitor
  on public.link_events (representative_id, visitor_id)
  where visitor_id is not null;

alter table public.link_events enable row level security;

-- Escrita: ninguém escreve pelo navegador. Os eventos entram pela rota
-- /api/rastreio, que roda com a service role e ignora RLS. Sem política de
-- insert, nem anon nem logado consegue forjar evento.
drop policy if exists "link_events_select_owner_or_admin" on public.link_events;

create policy "link_events_select_owner_or_admin"
  on public.link_events for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.representatives r
      where r.id = link_events.representative_id
        and r.user_id = auth.uid()
    )
  );
