import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ══════════════════════════════════════════════════════════════════════════
   Registro de eventos do link da turma.

   A gravação passa por aqui, e não pelo cliente, por dois motivos:

   1. `link_events` não tem política de insert no RLS. Só a service role
      escreve, então ninguém consegue inflar os números de uma turma
      chamando o Supabase direto do navegador.
   2. Origem e dispositivo saem do cabeçalho da requisição (referer e
      user-agent), que o cliente não precisa nem deveria montar.

   Quem chama nunca espera resposta: é fire-and-forget. Se falhar, o que se
   perde é uma linha de estatística — nada do fluxo do usuário depende disso.
   ══════════════════════════════════════════════════════════════════════════ */

const TIPOS = [
  "envio_whatsapp",
  "envio_copia",
  "envio_cartaz",
  "visita",
  // 'cadastro' = a pessoa preencheu o formulário do link.
  // 'cadastro_manual' = o representante adicionou pelo painel dele.
  "cadastro",
  "cadastro_manual",
] as const;

type Tipo = (typeof TIPOS)[number];

type Body = {
  representative_id?: string;
  tipo?: string;
  visitor_id?: string;
  /** E-mail de quem se cadastrou — só nos eventos de cadastro. */
  identificador?: string;
};

/** Nome amigável da origem, a partir do referer. */
function origemDoReferer(referer: string | null, host: string | null): string {
  if (!referer) return "direto";
  let dominio = "";
  try {
    dominio = new URL(referer).hostname.toLowerCase();
  } catch {
    return "direto";
  }
  // Navegação dentro do próprio site não é uma origem externa.
  if (host && dominio === host.split(":")[0].toLowerCase()) return "direto";
  if (/(whatsapp|wa\.me)/.test(dominio)) return "whatsapp";
  if (/instagram/.test(dominio)) return "instagram";
  if (/facebook|fb\./.test(dominio)) return "facebook";
  if (/t\.co|twitter|x\.com/.test(dominio)) return "twitter";
  if (/google/.test(dominio)) return "google";
  if (/tiktok/.test(dominio)) return "tiktok";
  if (/telegram|t\.me/.test(dominio)) return "telegram";
  return dominio.replace(/^www\./, "");
}

function dispositivoDoAgente(ua: string | null): string {
  if (!ua) return "desconhecido";
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "celular" : "computador";
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const representativeId = body.representative_id;
  const tipo = body.tipo as Tipo | undefined;

  if (!representativeId || !tipo || !TIPOS.includes(tipo)) {
    return NextResponse.json(
      { ok: false, error: "representative_id e tipo válido são obrigatórios" },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { ok: false, error: "Supabase service not configured" },
      { status: 500 },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Turma inexistente (ou já excluída) não gera evento órfão.
  const { data: rep } = await admin
    .from("representatives")
    .select("id")
    .eq("id", representativeId)
    .maybeSingle();

  if (!rep) {
    return NextResponse.json(
      { ok: false, error: "representative not found" },
      { status: 404 },
    );
  }

  // O visitor_id é opaco e vem do navegador: corta em 64 para nenhum
  // payload gigante entrar no banco.
  const visitorId = (body.visitor_id || "").slice(0, 64) || null;

  // O identificador é o e-mail de quem se cadastrou, e é o que casa o
  // evento com a linha em `students`. Normalizado aqui para o casamento
  // não depender de maiúscula ou espaço sobrando digitado no formulário.
  const identificador =
    tipo === "cadastro" || tipo === "cadastro_manual"
      ? (body.identificador || "").trim().toLowerCase().slice(0, 255) || null
      : null;

  const { error } = await admin.from("link_events").insert({
    representative_id: representativeId,
    tipo,
    visitor_id: visitorId,
    identificador,
    origem: origemDoReferer(
      req.headers.get("referer"),
      req.headers.get("host"),
    ),
    dispositivo: dispositivoDoAgente(req.headers.get("user-agent")),
  });

  if (error) {
    // A tabela pode ainda não existir num ambiente onde a migração não
    // rodou. Isso não é motivo para estourar erro na tela de ninguém.
    return NextResponse.json({ ok: false, error: error.message }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
