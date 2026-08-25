import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarEmail } from "@/lib/email/enviar";
import { listaParada, metaSemAtendimento, metaUmaAdesao } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ══════════════════════════════════════════════════════════════════════════
   Rotina diária dos e-mails automáticos.

   Roda uma vez por dia (Vercel Cron) e decide, turma por turma, se algum dos
   três avisos se aplica. O que já foi enviado fica em `emails_enviados` — é
   ela que impede a mesma mensagem de sair de novo no dia seguinte.

   Para conferir sem disparar nada:  GET /api/cron/emails?dry=1
   ══════════════════════════════════════════════════════════════════════════ */

const META_CONVITES = 30;
const DIA = 86_400_000;

/** Silêncio mínimo entre dois avisos do mesmo tipo. */
const INTERVALO_DIAS = 5;
/** Teto de cobranças para a mesma parada — depois disso, vira caso de WhatsApp. */
const MAX_LEMBRETES_PARADA = 3;

type Rep = {
  id: string;
  name: string;
  email: string;
  course_name: string;
  institution_name: string;
  slug: string;
  contacted_at: string | null;
  meta_notified_at: string | null;
  created_at: string;
};

type Aluno = {
  representative_id: string;
  qtd_convites: number | null;
  created_at: string;
};

type Registro = {
  representative_id: string;
  tipo: string;
  enviado_em: string;
};

const dias = (desde: string) => Math.floor((Date.now() - new Date(desde).getTime()) / DIA);

export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  const autorizacao = req.headers.get("authorization");
  if (segredo && autorizacao !== `Bearer ${segredo}`) {
    return NextResponse.json({ ok: false, error: "Não autorizado" }, { status: 401 });
  }

  const simulacao = new URL(req.url).searchParams.get("dry") === "1";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const marketing = process.env.MARKETING_EMAIL;

  if (!supabaseUrl || !serviceKey || !base) {
    return NextResponse.json(
      { ok: false, error: "Supabase ou NEXT_PUBLIC_APP_URL não configurados" },
      { status: 500 },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [repRes, aluRes, envRes] = await Promise.all([
    admin
      .from("representatives")
      .select(
        "id,name,email,course_name,institution_name,slug,contacted_at,meta_notified_at,created_at",
      ),
    admin.from("students").select("representative_id,qtd_convites,created_at"),
    admin.from("emails_enviados").select("representative_id,tipo,enviado_em"),
  ]);

  const erro = repRes.error || aluRes.error || envRes.error;
  if (erro) {
    return NextResponse.json({ ok: false, error: erro.message }, { status: 500 });
  }

  const reps = (repRes.data || []) as Rep[];
  const alunos = (aluRes.data || []) as Aluno[];
  const enviados = (envRes.data || []) as Registro[];

  const acoes: Array<{ turma: string; tipo: string; para: string; assunto: string }> = [];
  const falhas: Array<{ turma: string; tipo: string; erro: string }> = [];

  async function despachar(
    rep: Rep,
    tipo: string,
    para: string,
    modelo: { assunto: string; html: string },
  ) {
    acoes.push({ turma: `${rep.name} · ${rep.course_name}`, tipo, para, assunto: modelo.assunto });
    if (simulacao) return;

    const r = await enviarEmail({ para, assunto: modelo.assunto, html: modelo.html });
    if (!r.ok) {
      falhas.push({ turma: rep.name, tipo, erro: r.erro });
      return;
    }
    await admin.from("emails_enviados").insert({
      representative_id: rep.id,
      tipo,
      destinatario: para,
      assunto: modelo.assunto,
    });
  }

  for (const rep of reps) {
    const meus = alunos.filter((a) => a.representative_id === rep.id);
    const convites = meus.reduce((s, a) => s + (a.qtd_convites || 0), 0);
    const adesoes = meus.length;

    const ultimaAdesao = meus.length
      ? meus.reduce((a, b) => (a.created_at > b.created_at ? a : b)).created_at
      : rep.created_at;

    const historico = enviados
      .filter((e) => e.representative_id === rep.id)
      .sort((a, b) => (a.enviado_em > b.enviado_em ? -1 : 1));

    const ultimoDoTipo = (tipo: string) =>
      historico.find((e) => e.tipo === tipo)?.enviado_em;

    const turma = {
      nome: rep.name,
      curso: rep.course_name,
      instituicao: rep.institution_name,
      convites,
      adesoes,
      meta: META_CONVITES,
      link: `${base}/adesao/${rep.slug}`,
    };

    /* ── 3. Bateu a meta sozinho: a turma inteira ainda está de fora ── */
    if (convites >= META_CONVITES && adesoes === 1 && !ultimoDoTipo("meta_uma_adesao")) {
      const modelo = metaUmaAdesao(turma, base);
      await despachar(rep, "meta_uma_adesao", rep.email, modelo);
    }

    /* ── 1. A lista parou de crescer ──
       Só contam os lembretes posteriores à última adesão: se a turma voltou a
       crescer e parou de novo, a contagem recomeça do zero. */
    if (convites < META_CONVITES && dias(ultimaAdesao) >= INTERVALO_DIAS) {
      const desdeAUltimaAdesao = historico.filter(
        (e) => e.tipo === "lista_parada" && e.enviado_em > ultimaAdesao,
      );
      const ultimo = desdeAUltimaAdesao[0]?.enviado_em;
      const podeMandar =
        desdeAUltimaAdesao.length < MAX_LEMBRETES_PARADA &&
        (!ultimo || dias(ultimo) >= INTERVALO_DIAS);

      if (podeMandar) {
        const modelo = listaParada(turma, base, dias(ultimaAdesao));
        await despachar(rep, "lista_parada", rep.email, modelo);
      }
    }

    /* ── 2. Bateu a meta e ninguém atendeu — aviso interno, sem teto ── */
    if (convites >= META_CONVITES && !rep.contacted_at && marketing) {
      const ultimo = ultimoDoTipo("meta_sem_atendimento");
      if (!ultimo || dias(ultimo) >= INTERVALO_DIAS) {
        const espera = dias(rep.meta_notified_at || ultimaAdesao);
        const modelo = metaSemAtendimento(turma, base, espera);
        await despachar(rep, "meta_sem_atendimento", marketing, modelo);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    simulacao,
    enviados: simulacao ? 0 : acoes.length - falhas.length,
    previstos: acoes.length,
    acoes,
    falhas,
  });
}
