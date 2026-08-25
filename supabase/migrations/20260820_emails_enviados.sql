-- Registro dos e-mails automáticos já disparados.
--
-- Sem isso não há como saber se a pessoa já recebeu o aviso: a rotina roda
-- todo dia e reenviaria a mesma mensagem a cada execução. A tabela é a
-- memória do robô, e também o histórico para conferir o que saiu.

create table if not exists public.emails_enviados (
  id                uuid primary key default gen_random_uuid(),
  representative_id uuid not null references public.representatives(id) on delete cascade,
  -- 'lista_parada' | 'meta_sem_atendimento' | 'meta_uma_adesao'
  tipo              text not null,
  destinatario      text not null,
  assunto           text,
  enviado_em        timestamptz not null default now()
);

-- A consulta quente é sempre "qual foi o último desse tipo para essa turma".
create index if not exists idx_emails_enviados_rep_tipo
  on public.emails_enviados (representative_id, tipo, enviado_em desc);

alter table public.emails_enviados enable row level security;

-- Ninguém acessa pelo navegador: quem escreve é a rotina, com a service role,
-- que ignora RLS. Sem política, a tabela fica invisível para anon e logado.
