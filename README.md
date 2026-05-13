# Alpha Convites - Lista de Adesao

Plataforma premium para captacao de leads qualificados de formandos.
Stack: **Next.js 14 + Supabase + Vercel**.

## Stack

- **Next.js 14** (App Router + API Routes) + TypeScript
- **Tailwind CSS** com paleta premium customizada
- **Supabase** (Auth + Postgres + Realtime + RLS)
- **API CPF Hub** (apicpf.com) para validacao de CPF
- **Vercel** para deploy

## Estrutura

```text
frontend/
  app/
    page.tsx                       landing
    cadastro/page.tsx              cadastro do representante
    login/page.tsx                 login do representante
    dashboard/page.tsx             painel do representante
    adesao/[slug]/page.tsx         formulario publico
    admin/login/page.tsx           login administrativo
    admin/dashboard/page.tsx       painel administrativo
    admin/dashboard/[id]/page.tsx  detalhe do representante
    api/cpf/[cpf]/route.ts         consulta CPF server-side
  components/
    ui/                            Button, Input, Card, Spinner, Badge, Select
    forms/                         CpfInput, PhoneInput, Autocomplete
    dashboard/                     LinkCard, AdesoesCard, AcabamentosShowcase
  lib/                             supabase, cpf, slugify, ibge, cursos, format

supabase/
  schema.sql                       tabelas + RLS + realtime + helpers
```

## Como Rodar Localmente

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Abra http://localhost:3000

## Variaveis De Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_APP_URL=http://localhost:3000

CPF_API_TOKEN=...
CPF_API_URL=https://apicpf.com/api/consulta
```

## Banco De Dados

Execute o conteudo de [`supabase/schema.sql`](supabase/schema.sql) no SQL
Editor do Supabase. O schema cria:

- `public.representatives`
- `public.students`
- `public.admins`

Tambem habilita RLS, realtime para `students`, a funcao publica segura para
carregar uma turma por slug e a migracao dos dados antigos de `formandos` e
`adesoes`, quando essas tabelas existirem.

## Fluxo

1. Representante cria conta em `/cadastro`.
2. Conta e criada no Supabase Auth.
3. Registro do representante e salvo em `public.representatives`.
4. O painel `/dashboard` gera link publico e QR Code.
5. Formandos acessam `/adesao/{slug}` sem login.
6. O formulario salva alunos em `public.students`.
7. O representante ve apenas os alunos da propria turma.
8. O admin acessa `/admin/login` e visualiza todos os dados em `/admin/dashboard`.

## Admin Padrao

Crie no Supabase Auth o usuario:

- Email: `alphaconvites@adm.com`
- Senha: definida no ambiente operacional do projeto

Ao criar esse usuario, o trigger do schema registra automaticamente o usuario
em `public.admins`. Se o usuario ja existir, o schema tambem registra sem
duplicar.
