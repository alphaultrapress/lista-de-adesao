# Lista de Adesão — Alpha Convites

Documentação do que existe **hoje** no projeto e de como o fluxo funciona
de ponta a ponta.

Última revisão: 14/08/2026 (baseada no código do branch `main`).

---

## 1. O que é

Plataforma de captação de leads de turmas de formatura. A ideia central:

> O **representante da turma** se cadastra, recebe um **link público
> exclusivo** (e um QR Code), compartilha com os colegas. Cada colega
> preenche um formulário rápido dizendo quantos convites pretende comprar.
> Quando a turma soma **30 convites**, o comercial da Alpha é acionado.

Não é uma loja e não processa pagamento. É uma lista de intenção de compra
que vira **Lead no Bitrix24**.

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Frontend + API | Next.js 14 (App Router) + TypeScript |
| Estilo | Tailwind CSS (paleta premium customizada) |
| Banco / Auth / Realtime | Supabase (Postgres + RLS) |
| CRM | Bitrix24 (webhook de entrada) |
| PDF | jsPDF + jspdf-autotable |
| QR Code | qrcode.react + canvas próprio |
| Deploy | Vercel |

Rodar local:

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
```

> A pasta `backend/` existe mas está **vazia** — tudo roda dentro do
> Next.js (API Routes). Pode ser removida.

---

## 3. Papéis do sistema

| Papel | Como entra | O que faz |
|---|---|---|
| **Convidado / formando** | Só o link público, sem login | Preenche nome, WhatsApp, e-mail e quantidade de convites |
| **Representante** | Cria conta em `/cadastro`, entra em `/login` | Vê o painel da própria turma, compartilha o link, acompanha a meta |
| **Admin (Alpha)** | `/admin/login` | Vê todas as turmas, gera Lead no Bitrix, baixa PDF, marca como atendida, exclui turma |

---

## 4. Páginas que existem hoje

```text
/                              landing institucional (vídeo, galeria, depoimentos)
/cadastro                      cadastro do representante
/login                         login do representante
/dashboard                     painel da turma do representante
/adesao/[slug]                 formulário público da turma (sem login)
/admin/login                   login administrativo
/admin/dashboard               lista de todas as turmas
/admin/dashboard/[id]          detalhe da turma + ações comerciais
```

### API Routes

```text
POST   /api/notify-meta                     verifica se a turma bateu 30 convites
POST   /api/rastreio                        registra evento do link (envio, visita, cadastro)
GET    /api/cpf/[cpf]                       consulta CPF (API CPF Hub) — legado
GET    /api/instituicoes?q=                 autocomplete de faculdades
POST   /api/representatives/[id]/lead       cria o Lead no Bitrix24  (admin)
POST   /api/representatives/[id]/contact    marca/desmarca "atendida"  (admin)
DELETE /api/representatives/[id]            exclui turma + conta de login (admin)
```

---

## 5. O fluxo completo

### 5.1 Representante se cadastra — `/cadastro`

Campos coletados: **nome, e-mail, WhatsApp, curso, instituição, estado,
cidade, semestre de formatura, senha**.

- Instituição usa autocomplete: lista local (`lib/instituicoes.ts`) + API
  pública Hipolabs, mescladas e deduplicadas.
- Estado/cidade vêm da API do IBGE (`lib/ibge.ts`).
- O e-mail é checado antes contra `representatives` e `admins` para evitar
  duplicidade.
- Cria conta no **Supabase Auth** e insere linha em `public.representatives`.
- **Gera o slug** a partir de `curso + instituição + semestre`
  (`lib/slugify.ts`). Se colidir, tenta `-2`, `-3`… até 5 vezes.
- Se a pessoa já tinha falado com um consultor pelo site (WhatsApp flutuante),
  o consultor fica gravado em `consultant_name` / `consultant_phone`.

### 5.2 Painel do representante — `/dashboard`

Protegido **no cliente** (`supabase.auth.getSession()`); o `middleware.ts`
está desativado de propósito, porque a sessão do Supabase JS fica no
storage do navegador e não em cookie — o middleware no Edge não a enxerga
e criava loop de redirect entre `/login` e `/dashboard`.

O que o representante tem ali:

- **Card de compartilhamento**: botão que abre o WhatsApp com a mensagem
  já montada com os dados da turma (`lib/share.ts`), botão de copiar link
  e o QR Code.
- **Download do cartaz**: gera uma imagem 1080×1350 com o QR no centro,
  curso e instituição (`lib/qrPoster.ts`) — pronta pra postar em story.
- **Lista da turma**: quem já aderiu, com iniciais coloridas e destaque
  animado para quem acabou de entrar.
- **Barra de progresso da meta** (30 convites) e cards de resumo:
  total de convites, participantes, quantos faltam.
- **Adicionar aluno manualmente** (modal), caso alguém passe os dados
  por fora do link.
- **Realtime**: assinatura em `postgres_changes` na tabela `students`
  filtrada por `representative_id` — a lista atualiza sozinha quando
  alguém preenche o formulário, sem refresh.

### 5.3 Página pública — `/adesao/[slug]`

É a página que o formando recebe. Landing completa: hero com vídeo/imagem,
diferenciais, prova social, galeria de acabamentos e **dois formulários
idênticos** (um logo depois do hero, outro no fim da página).

Formulário pede apenas: **nome, WhatsApp, e-mail, quantidade de convites**.
(CPF e data de nascimento **foram removidos** do formulário — ver §7.)

Como a turma é carregada (cascata de fallback):

1. RPC `get_representative_by_slug` (função `security definer`, é o
   caminho oficial para o público ler a turma sem quebrar o RLS);
2. se falhar, `select` direto em `representatives`;
3. se falhar, tabela legada `formandos`.

Se nada casar → tela "Turma não encontrada".

Ao enviar:

- `insert` em `public.students`;
- erro `23505` = e-mail duplicado na turma → mensagem no campo;
- erro `42P01` = tabela não existe → grava na tabela legada `adesoes`;
- dispara `POST /api/notify-meta` em *fire-and-forget* (não trava a UX);
- mostra a tela de sucesso "Recebemos seu interesse".

**Preview no WhatsApp**: a página tem `generateMetadata` dinâmico. O
Open Graph muda por turma (título com curso + instituição, descrição,
`og:image` 1200×630 e `og:video`). Por isso o card do WhatsApp sai
personalizado por link. Isso **depende de `NEXT_PUBLIC_APP_URL` apontar
para o domínio real em produção** — se ficar `localhost`, o card não
aparece.

### 5.4 A meta de 30 convites — `/api/notify-meta`

Roda com a **service role key** (server-side). Passo a passo:

1. Carrega o representante.
2. Se `meta_notified_at` já estiver preenchido → sai (não notifica duas vezes).
3. Soma `qtd_convites` de todos os alunos da turma.
4. Se o total < 30 → só devolve o total, nada acontece.
5. Se ≥ 30 → envia notificação `im.notify` no Bitrix para o usuário
   configurado e grava `meta_notified_at`.

O carimbo é gravado **mesmo se o Bitrix falhar** — o que importa é a turma
aparecer sinalizada no painel admin.

### 5.4.1 Rastreio do link — quem enviou, quem entrou, quem se cadastrou

Três gatilhos gravam evento em `link_events` (todos *fire-and-forget*: se o
rastreio falhar, nada na tela quebra):

| Onde | Quando | Tipo |
|---|---|---|
| Painel do representante | abre o WhatsApp, copia o link ou baixa o cartaz | `envio_*` |
| `/adesao/[slug]` | a turma carrega com sucesso | `visita` |
| `/adesao/[slug]` | o formulário é enviado com sucesso | `cadastro` |
| Painel do representante | adiciona um colega à mão | `cadastro_manual` |

O `visitor_id` é um uuid gravado no `localStorage` do visitante
(`lib/rastreio.ts`). Não identifica ninguém — serve só para separar
"10 visitas" de "10 pessoas" e para saber se quem visitou chegou a se
cadastrar. Visita repetida do mesmo navegador só conta de novo depois de
30 minutos.

**Origem de cada cadastro.** Os dois eventos de cadastro carregam o e-mail
de quem entrou (`identificador`), e é ele que casa o evento com a linha em
`students` — o formulário público insere sem ler a linha de volta (o RLS
não deixa o anônimo fazer `select` em `students`), então o id do aluno não
existe do lado do navegador. Com isso o painel classifica linha a linha:

| Selo | Regra |
|---|---|
| É o representante | e-mail do aluno = e-mail do representante (a linha nasce no `/cadastro`) |
| Entrou pelo link | existe evento `cadastro` com aquele e-mail |
| Cadastrado pelo representante | existe evento `cadastro_manual` com aquele e-mail |
| Origem não registrada | nenhum evento — cadastro anterior ao rastreio |

A regra do representante vem primeiro de propósito: ela é a única que vale
retroativamente, para as turmas anteriores ao rastreio.

No painel admin, o menu **Ações → Rastreio do link** abre o modal com o
funil da turma: envios, visitas, quem se cadastrou (com o selo de origem) e
quem entrou e saiu sem preencher.

⚠️ **"Quem recebeu o link e não entrou" não é rastreável** e o modal diz
isso na cara. O link é um só para a turma inteira: o representante escolhe
os contatos dentro do WhatsApp, e essa escolha nunca passa pelo sistema.
Para ter esse número nome a nome seria preciso o representante cadastrar os
colegas e disparar um link individual por pessoa — mudança no fluxo dele,
não só no painel.

### 5.5 Painel admin — `/admin/dashboard`

Lista todas as turmas com busca por **nome, curso e instituição**, contagem
de adesões e total de convites por turma, e o status da meta.

No detalhe (`/admin/dashboard/[id]`):

- dados completos da turma (inclusive estado/cidade e consultor vinculado);
- lista de todos os alunos com telefone e e-mail;
- **Gerar Lead no Bitrix** — ver abaixo;
- **Baixar PDF** da lista (`lib/leadPdf.ts`);
- **Marcar como atendida** (`contacted_at`);
- **Excluir turma** — apaga a linha do representante (os alunos caem por
  `ON DELETE CASCADE`) e também remove a conta do Auth, pra não deixar
  usuário órfão.

### 5.6 Geração do Lead no Bitrix24

`POST /api/representatives/[id]/lead`. Valida o token do usuário, confirma
que ele está na tabela `admins`, e então:

1. `crm.lead.add` com título, nome/e-mail do representante, telefones de
   todos os alunos, `OPPORTUNITY` = total de convites e um `COMMENTS`
   formatado com a lista completa de adesões.
2. **`crm.lead.update` logo em seguida** com os campos definitivos.
   Isso é intencional: o `crm.lead.add` dispara um handler interno no
   Bitrix que limpa fonte, canal e campos customizados — o update
   sobrescreve depois.
3. Grava `lead_created_at`.

Campos customizados mapeados (IDs fixos do Bitrix da Alpha):

| Campo | ID | Valor |
|---|---|---|
| Fonte | `SOURCE_ID` | `WEBFORM` (Marketing) |
| Canal de entrada | `UF_CRM_1531223348` | `11718` (Lista de Adesão) |
| Segmento | `UF_CRM_1690290010` | `6726` (Convites de Formatura) |
| Curso | `UF_CRM_1515146531` | texto |
| Faculdade | `UF_CRM_1515146539` | texto |
| Qtd. desejada | `UF_CRM_1633712858` | número |
| Ano de formatura | `UF_CRM_1515147878` | 2025→759, 2026→761, 2027→10834, 2028→10844, 2029→11700 |
| Semestre | `UF_CRM_1515147809` | 1→739, 2→741 |

⚠️ **O mapa de anos vai até 2029.** Turmas com ano fora dessa lista entram
no Bitrix sem o campo de ano preenchido.

---

## 6. Banco de dados

`supabase/schema.sql` cria tudo; `supabase/migrations/` tem os ajustes
posteriores (todos idempotentes, rodados à mão no SQL Editor).

### `representatives`

| Coluna | Observação |
|---|---|
| `id`, `user_id` | `user_id` referencia `auth.users`, cascade |
| `name`, `email` | |
| `course_name`, `institution_name`, `graduation_year` | |
| `state`, `city` | migração `20260610_state_city.sql` |
| `slug` | único — é a URL pública |
| `consultant_name`, `consultant_phone` | consultor que atendeu no site |
| `meta_notified_at` | carimbo dos 30 convites |
| `contacted_at` | admin marcou como atendida |
| `lead_created_at` | Lead já criado no Bitrix |

### `students`

| Coluna | Observação |
|---|---|
| `representative_id` | FK cascade |
| `full_name`, `phone`, `email` | |
| `qtd_convites` | default 1 |
| `cpf`, `birth_date` | **legado — hoje nulos**, ver §7 |

### `link_events`

Migração `20260831_rastreio_link.sql`. Uma linha por evento do ciclo do link
da turma.

| Coluna | Observação |
|---|---|
| `representative_id` | FK cascade |
| `tipo` | `envio_whatsapp`, `envio_copia`, `envio_cartaz`, `visita`, `cadastro`, `cadastro_manual` |
| `visitor_id` | id anônimo do navegador — só nos eventos `visita` e `cadastro` |
| `identificador` | e-mail (minúsculo) de quem se cadastrou — migração `20260831_rastreio_origem_cadastro.sql` |
| `origem` | de onde a visita veio (`whatsapp`, `instagram`, `direto`…) |
| `dispositivo` | `celular` ou `computador` |

**Ninguém escreve pelo navegador.** A tabela não tem política de insert: os
eventos entram por `POST /api/rastreio`, que roda com a service role. Isso
impede qualquer um de inflar os números de uma turma chamando o Supabase
direto do cliente. O `select` é liberado para o dono da turma e para o admin.

### `admins`

`user_id` + `email`. Um trigger em `auth.users` registra automaticamente
`alphaconvites@adm.com` como admin quando essa conta é criada.

### RLS (resumo)

- `representatives`: cada um lê/edita só a própria linha; admin lê e edita todas.
- `students`: **insert liberado para `anon`** (é o formulário público), mas
  com `check` de que o `representative_id` existe de verdade
  (`representative_exists()`). Select/update/delete só para o dono da turma
  ou admin.
- Funções `security definer`: `is_admin()`, `get_representative_by_slug()`,
  `representative_exists()`.

### Realtime

`students` está na publication `supabase_realtime` e com
`REPLICA IDENTITY FULL` — sem isso os eventos de UPDATE não trazem o
`representative_id` e o filtro do dashboard não dispara o reload.

---

## 7. Pontos de atenção / dívidas conhecidas

1. **`schema.sql` está desatualizado.** Ele ainda declara `cpf` e
   `birth_date` como `not null` e cria a constraint
   `students_unique_cpf_per_representative`. A migração
   `20260603_remove_cpf_birthdate.sql` derruba as duas coisas. Quem rodar
   só o `schema.sql` num banco novo **quebra o formulário público**.
   Rodar sempre schema + migrações, nessa ordem.

2. **`RESEND_API_KEY` está no `.env.local.example` mas não é usada em
   lugar nenhum do código.** O envio de e-mail ao bater a meta foi
   substituído pela notificação no Bitrix. Ou implementa, ou remove do
   exemplo pra não confundir.

3. **`/api/cpf/[cpf]` continua no ar**, mas nenhum formulário chama mais.
   É resto da versão que pedia CPF.

4. **Limite divergente de convites.** O formulário do topo aceita até 4
   dígitos; o do rodapé, só 2. A migração
   `20260527_remove_qtd_convites_limit.sql` tirou o teto do banco.

5. **Rotas protegidas só no cliente.** `middleware.ts` é um no-op
   proposital (o comentário no arquivo explica o porquê). A proteção real
   dos dados é o RLS do Supabase — o redirect é só UX.

6. **Tabelas legadas** `formandos` e `adesoes` ainda têm código de
   fallback espalhado. Se o banco de produção já migrou, esse caminho é
   morto.

7. **`backend/` está vazia.**

---

## 8. Variáveis de ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...        # server-side, NUNCA com NEXT_PUBLIC_

# App — em produção precisa ser o domínio real,
# senão o preview do WhatsApp não funciona
NEXT_PUBLIC_APP_URL=http://localhost:3000

# CPF (legado, não usado hoje)
CPF_API_TOKEN=...
CPF_API_URL=https://apicpf.com/api/consulta

# Bitrix24
BITRIX_WEBHOOK_URL=https://SEU-DOMINIO.bitrix24.com.br/rest/USER_ID/CHAVE/
BITRIX_ASSIGNED_BY_ID=              # id numérico do responsável pelo Lead
```

---

## 9. Resumo do ciclo de vida de uma turma

```text
Representante se cadastra
        ↓  gera slug único
Link /adesao/{slug} + QR Code
        ↓  compartilhado no WhatsApp (com preview personalizado)
Formandos preenchem (sem login)
        ↓  realtime atualiza o painel do representante
Turma soma 30 convites
        ↓  notify-meta → notificação no Bitrix + meta_notified_at
Admin abre /admin/dashboard/[id]
        ↓  "Gerar Lead" → crm.lead.add + crm.lead.update
Lead no Bitrix24 → comercial assume
        ↓
Admin marca "atendida" (contacted_at)
```
