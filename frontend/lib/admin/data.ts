import {
  META_CONVITES,
  Representative,
  Student,
  supabase,
} from "@/lib/supabase";

/* ──────────────────────────────────────────────────────────────────────────
   Camada de dados do painel.

   Regra dura: tudo aqui sai de `representatives` e `students` reais. Nenhum
   número é inventado, e onde o banco não tem o campo a função devolve null em
   vez de estimar — quem exibe decide como mostrar a ausência.
   ────────────────────────────────────────────────────────────────────────── */

export type StatusRep =
  | "novo"
  | "em_andamento"
  | "pendente"
  | "meta_atingida"
  | "atendida"
  | "inativo"
  | "bloqueado";

export const STATUS_LABEL: Record<StatusRep, string> = {
  novo: "Novo",
  em_andamento: "Em andamento",
  pendente: "Pendente",
  meta_atingida: "Meta atingida",
  atendida: "Atendida",
  inativo: "Inativo",
  bloqueado: "Bloqueado",
};

/** Representante já com os números da turma agregados. */
export type RepLinha = Representative & {
  adesoes: number;
  convites: number;
  status: StatusRep;
  /** Timestamp mais recente entre cadastro, adesões e contatos. */
  ultimaAtividade: string | null;
  /** Telefone do próprio representante — ele também entra na lista da turma,
   *  e é a adesão com o mesmo e-mail que carrega o número dele. */
  telefone?: string;
};

const DIA = 86_400_000;

/**
 * Status derivado dos dados reais.
 *
 * "Inativo" e "Bloqueado" da especificação não são deriváveis: não existe
 * coluna de situação em `representatives`. Ficam no tipo para a tela já saber
 * exibi-los, mas nunca são atribuídos aqui — inventar seria pior que faltar.
 */
function derivarStatus(
  convites: number,
  adesoes: number,
  criadoEm: string,
  contatadaEm: string | null | undefined,
) {
  // O atendimento é o último passo da esteira: quem já foi contatado pela
  // equipe mostra "Atendida", não mais "Meta atingida".
  if (contatadaEm) return "atendida" as StatusRep;
  if (convites >= META_CONVITES) return "meta_atingida" as StatusRep;
  if (adesoes > 0) return "em_andamento" as StatusRep;
  const idade = Date.now() - new Date(criadoEm).getTime();
  return (idade < 7 * DIA ? "novo" : "pendente") as StatusRep;
}

export type PainelDados = {
  representantes: Representative[];
  alunos: Student[];
  linhas: RepLinha[];
};

/** Carrega representantes e alunos. Mantém a ordenação por cadastro desc. */
export async function carregarPainel(): Promise<PainelDados> {
  const [repRes, aluRes] = await Promise.all([
    supabase.from("representatives").select("*").order("created_at", { ascending: false }),
    supabase.from("students").select("*").order("created_at", { ascending: false }),
  ]);

  if (repRes.error) throw new Error(repRes.error.message);
  if (aluRes.error) throw new Error(aluRes.error.message);

  const representantes = (repRes.data as Representative[]) || [];
  const alunos = (aluRes.data as Student[]) || [];

  return { representantes, alunos, linhas: montarLinhas(representantes, alunos) };
}

export function montarLinhas(
  representantes: Representative[],
  alunos: Student[],
): RepLinha[] {
  const adesoesPor: Record<string, number> = {};
  const telefonePor: Record<string, string> = {};
  const convitesPor: Record<string, number> = {};
  const ultimaPor: Record<string, string> = {};

  for (const a of alunos) {
    adesoesPor[a.representative_id] = (adesoesPor[a.representative_id] || 0) + 1;
    convitesPor[a.representative_id] =
      (convitesPor[a.representative_id] || 0) + (a.qtd_convites || 0);
    if (a.phone && a.email) telefonePor[`${a.representative_id}|${a.email.toLowerCase()}`] = a.phone;
    const atual = ultimaPor[a.representative_id];
    if (!atual || a.created_at > atual) ultimaPor[a.representative_id] = a.created_at;
  }

  return representantes.map((r) => {
    const adesoes = adesoesPor[r.id] || 0;
    const convites = convitesPor[r.id] || 0;
    // Última atividade = o carimbo mais recente que o banco realmente tem.
    const candidatos = [
      ultimaPor[r.id],
      r.contacted_at,
      r.lead_created_at,
      r.meta_notified_at,
      r.created_at,
    ].filter(Boolean) as string[];
    const ultimaAtividade = candidatos.length
      ? candidatos.reduce((a, b) => (a > b ? a : b))
      : null;

    return {
      ...r,
      adesoes,
      convites,
      status: derivarStatus(convites, adesoes, r.created_at, r.contacted_at),
      ultimaAtividade,
      telefone: telefonePor[`${r.id}|${(r.email || "").toLowerCase()}`],
    };
  });
}

/* ─────────────────────────────── indicadores ─────────────────────────────── */

export type Indicador = {
  chave: string;
  label: string;
  valor: string;
  /** Linha curta de contexto. Vazia quando não agrega nada. */
  apoio: string;
  /** Explicação do cálculo, para o tooltip. */
  calculo: string;
  href: string;
};

/** Os quatro números que abrem o painel. */
export function indicadores(d: PainelDados): Indicador[] {
  const { linhas } = d;
  const total = linhas.length;
  const comAdesoes = linhas.filter((r) => r.adesoes > 0).length;
  const naMeta = linhas.filter((r) => r.convites >= META_CONVITES);
  // "Atendida" = turma que bateu a meta e já recebeu contato da equipe.
  // O carimbo vem de `contacted_at`, o mesmo que a tela de detalhe grava.
  const atendidas = naMeta.filter((r) => Boolean(r.contacted_at)).length;

  const parte = (n: number) =>
    total ? `${((n / total) * 100).toFixed(0)}% do total` : "";

  return [
    {
      chave: "representantes",
      label: "Representantes",
      valor: String(total),
      apoio: "Turmas cadastradas",
      calculo: "Total de representantes cadastrados na plataforma.",
      href: "/admin/representantes",
    },
    {
      chave: "com_adesoes",
      label: "Com adesões",
      valor: String(comAdesoes),
      apoio: parte(comAdesoes),
      calculo: "Representantes com pelo menos um aluno na lista.",
      href: "/admin/representantes?status=em_andamento",
    },
    {
      chave: "metas_atingidas",
      label: "Metas atingidas",
      valor: String(naMeta.length),
      apoio: parte(naMeta.length),
      calculo: `Turmas que somaram ${META_CONVITES} convites ou mais.`,
      href: "/admin/representantes?status=meta_atingida",
    },
    {
      chave: "metas_atendidas",
      label: "Metas atendidas",
      valor: String(atendidas),
      apoio: naMeta.length
        ? `de ${naMeta.length} na meta`
        : "Nenhuma turma na meta",
      calculo:
        "Turmas que bateram a meta e já receberam contato da equipe comercial.",
      href: "/admin/representantes?status=atendida",
    },
  ];
}

/* ─────────────────────────── gráfico da meta ─────────────────────────────── */

export type BarraMeta = {
  id: string;
  nome: string;
  curso: string;
  convites: number;
  adesoes: number;
  bateu: boolean;
};

/**
 * Convites por turma, ordenado do maior para o menor.
 * A tela desenha a linha da meta em cima e pinta de verde quem passou dela.
 */
export function graficoMetas(d: PainelDados): BarraMeta[] {
  return d.linhas
    .map((r) => ({
      id: r.id,
      // Primeiro nome basta no eixo; o resto vai no tooltip.
      nome: r.name.split(/\s+/)[0] ?? r.name,
      curso: r.course_name,
      convites: r.convites,
      adesoes: r.adesoes,
      bateu: r.convites >= META_CONVITES,
    }))
    .sort((a, b) => b.convites - a.convites);
}

/* ─────────────────────────── atividades e pendências ─────────────────────── */

export type Atividade = {
  id: string;
  acao: string;
  pessoa: string;
  quando: string;
  registro: string;
  href: string;
};

/** Timeline montada só com carimbos de tempo que existem no banco. */
export function atividades(d: PainelDados, limite = 12): Atividade[] {
  const eventos: Atividade[] = [];
  const repPorId = new Map(d.representantes.map((r) => [r.id, r]));

  for (const r of d.representantes) {
    eventos.push({
      id: `rep-${r.id}`,
      acao: "Representante cadastrado",
      pessoa: r.name,
      quando: r.created_at,
      registro: `${r.course_name} · ${r.institution_name}`,
      href: `/admin/dashboard/${r.id}`,
    });
    if (r.meta_notified_at) {
      eventos.push({
        id: `meta-${r.id}`,
        acao: "Meta de convites atingida",
        pessoa: r.name,
        quando: r.meta_notified_at,
        registro: r.course_name,
        href: `/admin/dashboard/${r.id}`,
      });
    }
    if (r.contacted_at) {
      eventos.push({
        id: `cont-${r.id}`,
        acao: "Turma atendida",
        pessoa: r.name,
        quando: r.contacted_at,
        registro: r.course_name,
        href: `/admin/dashboard/${r.id}`,
      });
    }
    if (r.lead_created_at) {
      eventos.push({
        id: `lead-${r.id}`,
        acao: "Lead gerado",
        pessoa: r.name,
        quando: r.lead_created_at,
        registro: r.course_name,
        href: `/admin/dashboard/${r.id}`,
      });
    }
  }

  for (const a of d.alunos.slice(0, 40)) {
    const r = repPorId.get(a.representative_id);
    eventos.push({
      id: `alu-${a.id}`,
      acao: "Aluno aderiu",
      pessoa: a.full_name,
      quando: a.created_at,
      registro: r ? `${r.course_name} · ${r.name}` : "Turma removida",
      href: r ? `/admin/dashboard/${r.id}` : "/admin/representantes",
    });
  }

  return eventos.sort((x, y) => (x.quando > y.quando ? -1 : 1)).slice(0, limite);
}

export type Pendencia = {
  id: string;
  titulo: string;
  detalhe: string;
  href: string;
  nivel: "atencao" | "info";
};

export function pendencias(d: PainelDados, limite = 8): Pendencia[] {
  const lista: Pendencia[] = [];

  for (const r of d.linhas) {
    if (r.convites >= META_CONVITES && !r.contacted_at) {
      lista.push({
        id: `atender-${r.id}`,
        titulo: "Turma na meta aguardando atendimento",
        detalhe: `${r.name} · ${r.convites} convites`,
        href: `/admin/dashboard/${r.id}`,
        nivel: "atencao",
      });
    }
  }

  for (const r of d.linhas) {
    const idade = Date.now() - new Date(r.created_at).getTime();
    if (r.adesoes === 0 && idade > 14 * DIA) {
      lista.push({
        id: `sem-adesao-${r.id}`,
        titulo: "Turma sem nenhuma adesão",
        detalhe: `${r.name} · cadastrada há mais de 14 dias`,
        href: `/admin/dashboard/${r.id}`,
        nivel: "info",
      });
    }
  }

  return lista.slice(0, limite);
}
