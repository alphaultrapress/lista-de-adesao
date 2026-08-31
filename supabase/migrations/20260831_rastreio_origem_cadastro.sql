-- =====================================================================
-- ORIGEM DE CADA CADASTRO DA TURMA
-- ---------------------------------------------------------------------
-- Complementa 20260831_rastreio_link.sql.
--
-- O painel precisa dizer, aluno por aluno, se a pessoa entrou sozinha
-- pelo link ou se o representante a cadastrou à mão. Para isso o evento
-- de cadastro passa a carregar o e-mail de quem se cadastrou — é o que
-- liga o evento à linha em `students`.
--
-- Por que o e-mail e não o id do aluno: o formulário público insere sem
-- ler de volta a linha criada (o RLS de `students` não deixa o anônimo
-- fazer select), então o id não existe do lado do navegador. O e-mail já
-- está em mãos no momento do envio e é único dentro da turma.
--
-- Novos tipos de evento gravados a partir daqui:
--   'cadastro'         → a pessoa preencheu o formulário do link
--   'cadastro_manual'  → o representante adicionou pelo painel dele
-- =====================================================================

alter table public.link_events
  add column if not exists identificador text;

comment on column public.link_events.identificador is
  'E-mail (minúsculo) de quem se cadastrou. Só nos eventos de cadastro; '
  'serve para casar o evento com a linha em public.students.';

-- A consulta do modal é "todos os cadastros dessa turma, por e-mail".
create index if not exists idx_link_events_identificador
  on public.link_events (representative_id, tipo, identificador)
  where identificador is not null;
