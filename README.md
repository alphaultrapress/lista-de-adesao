# Alpha Convites — Lista de Adesão

Plataforma premium para captação de leads qualificados de formandos.
Stack: **Next.js 14 + Supabase + Vercel**.

## Stack

- **Next.js 14** (App Router + API Routes) + TypeScript
- **Tailwind CSS** com paleta premium customizada
- **Supabase** (Auth + Postgres + Realtime + RLS)
- **API CPF Hub** (apicpf.com) para validação de CPF
- **Vercel** para deploy

## Estrutura

```
frontend/
├── app/
│   ├── page.tsx                 landing
│   ├── cadastro/page.tsx        cadastro do representante
│   ├── login/page.tsx           login do representante
│   ├── dashboard/page.tsx       painel (protegido)
│   ├── adesao/[slug]/page.tsx   formulário público
│   └── api/cpf/[cpf]/route.ts   consulta CPF (server-side)
├── components/
│   ├── ui/                      Button, Input, Card, Spinner, Badge, Select
│   ├── forms/                   CpfInput, PhoneInput, Autocomplete
│   ├── dashboard/               LinkCard, PricingTable, AdesoesCard
│   └── Brand.tsx                logo + footer
├── lib/                         supabase, cpf, slugify, ibge, cursos
├── public/
│   └── logos/                   logo-white.png, logo-dark.png
└── middleware.ts                proteção de rotas

supabase/
└── schema.sql                   tabelas + RLS + realtime
```

## Como rodar localmente

```bash
cd frontend
cp .env.local.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e CPF_API_TOKEN
npm install
npm run dev
```

Abra http://localhost:3000

## Variáveis de ambiente

### `frontend/.env.local`

```env
# Públicas (vão ao navegador — RLS protege)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Secretas (server-side apenas, NUNCA prefixar com NEXT_PUBLIC_)
CPF_API_TOKEN=...
CPF_API_URL=https://apicpf.com/api/consulta
```

## Banco de dados

Execute uma vez o conteúdo de [`supabase/schema.sql`](supabase/schema.sql)
no SQL Editor do Supabase. O schema cria as tabelas `formandos` e `adesoes`,
ativa RLS e habilita realtime para o contador ao vivo do dashboard.

## Deploy na Vercel

1. Suba o repositório no GitHub
2. Em https://vercel.com → **Add New Project** → importe o repositório
3. **Root Directory**: `frontend`
4. Em **Environment Variables**, cadastre:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (ex.: `https://alphaconvites.vercel.app`)
   - `CPF_API_TOKEN`
   - `CPF_API_URL`
5. **Deploy**

Após o deploy, atualize no Supabase:
- **Authentication → URL Configuration → Site URL** com a URL Vercel
- **Authentication → URL Configuration → Redirect URLs** adicione a URL Vercel

## Fluxo

1. Visitante chega em `/` e clica em **"Sou representante da turma"**
2. Em `/cadastro` preenche os dados (CPF valida via apicpf.com)
3. Conta criada no Supabase Auth + registro em `formandos`
4. Slug gerado: `curso-instituicao-semestre`
5. No `/dashboard`, recebe link público + QR Code + tabela de preços
6. Compartilha `https://alphaconvites.vercel.app/adesao/{slug}` com a turma
7. Colegas preenchem em `/adesao/{slug}` **sem login** — vai para `adesoes`
8. Contador no dashboard atualiza em tempo real via Supabase Realtime
