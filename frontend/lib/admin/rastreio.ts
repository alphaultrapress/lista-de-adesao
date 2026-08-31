import { supabase } from "@/lib/supabase";
import type { Student } from "@/lib/supabase";

/* ──────────────────────────────────────────────────────────────────────────
   Leitura do rastreio do link, para o painel.

   Mesma regra dura do resto da camada de dados: nada é estimado. O que o
   banco não tem, a tela mostra como ausente — e o modal explica por quê,
   em vez de inventar um número que pareça completo.
   ────────────────────────────────────────────────────────────────────────── */

export type TipoEvento =
  | "envio_whatsapp"
  | "envio_copia"
  | "envio_cartaz"
  | "visita"
  | "cadastro"
  | "cadastro_manual";

export type LinkEvent = {
  id: string;
  representative_id: string;
  tipo: TipoEvento;
  visitor_id: string | null;
  /** E-mail de quem se cadastrou — só nos eventos de cadastro. */
  identificador: string | null;
  origem: string | null;
  dispositivo: string | null;
  created_at: string;
};

/**
 * De onde veio cada linha da lista da turma.
 *
 * `representante` sai do próprio cadastro da conta: ao criar a turma, o
 * representante entra automaticamente na lista dela.
 *
 * `desconhecida` é honesto, não é falha: cadastro feito antes de o
 * rastreio existir não tem como ser classificado depois.
 */
export type OrigemCadastro = "link" | "manual" | "representante" | "desconhecida";

export const ORIGEM_LABEL: Record<OrigemCadastro, string> = {
  link: "Entrou pelo link",
  manual: "Cadastrado pelo representante",
  representante: "É o representante",
  desconhecida: "Origem não registrada",
};

export const CANAL_LABEL: Record<string, string> = {
  envio_whatsapp: "WhatsApp",
  envio_copia: "Link copiado",
  envio_cartaz: "Cartaz / QR Code",
};

export type Envio = {
  id: string;
  canal: string;
  quando: string;
};

export type VisitanteSemCadastro = {
  /** Id anônimo do navegador — nunca é nome nem contato. */
  visitorId: string;
  /** Rótulo curto e estável para a tela: "Visitante A3F2". */
  apelido: string;
  primeira: string;
  ultima: string;
  visitas: number;
  origem: string;
  dispositivo: string;
};

export type Rastreio = {
  /** Envios do link feitos pelo representante, do mais novo para o mais velho. */
  envios: Envio[];
  /** Total de aberturas da página de adesão. */
  visitas: number;
  /** Navegadores distintos que abriram a página. */
  pessoas: number;
  /** Navegadores que abriram e preencheram o formulário. */
  entraramECadastraram: number;
  /** Navegadores que abriram e não preencheram. */
  naoCadastraram: VisitanteSemCadastro[];
  /** Visitas de navegador sem storage: contam, mas não dá para acompanhar. */
  visitasSemIdentificacao: number;
  /** Primeiro evento registrado — desde quando esses números valem. */
  desde: string | null;
  /** E-mail (minúsculo) → como aquela pessoa entrou na lista. */
  origemPorEmail: Map<string, { origem: "link" | "manual"; veioDe?: string }>;
  /** Preenchido quando a tabela de rastreio ainda não existe no banco. */
  indisponivel?: string;
};

/** Últimos 4 caracteres do id, em maiúsculas: curto e estável na tela. */
function apelidoDe(visitorId: string): string {
  const limpo = visitorId.replace(/[^a-zA-Z0-9]/g, "");
  return `Visitante ${limpo.slice(-4).toUpperCase() || "----"}`;
}

/** Carrega e agrega os eventos de uma turma. */
export async function carregarRastreio(
  representativeId: string,
): Promise<Rastreio> {
  const vazio: Rastreio = {
    envios: [],
    visitas: 0,
    pessoas: 0,
    entraramECadastraram: 0,
    naoCadastraram: [],
    visitasSemIdentificacao: 0,
    desde: null,
    origemPorEmail: new Map(),
  };

  const { data, error } = await supabase
    .from("link_events")
    .select("*")
    .eq("representative_id", representativeId)
    .order("created_at", { ascending: false });

  if (error) {
    // 42P01 = tabela não existe: a migração do rastreio ainda não rodou.
    // Isso não é erro de uso, é ambiente — e a tela diz exatamente isso.
    const naoExiste = error.code === "42P01" || /link_events/.test(error.message);
    return {
      ...vazio,
      indisponivel: naoExiste
        ? "O rastreio ainda não foi ativado neste banco. Rode a migração 20260831_rastreio_link.sql no SQL Editor do Supabase."
        : error.message,
    };
  }

  return agregar((data as LinkEvent[]) || []);
}

export function agregar(eventos: LinkEvent[]): Rastreio {
  const envios: Envio[] = [];
  // Um registro por navegador, com o resumo das visitas dele.
  const porVisitante = new Map<
    string,
    { primeira: string; ultima: string; visitas: number; origem: string; dispositivo: string }
  >();
  const cadastraram = new Set<string>();
  const origemPorEmail = new Map<string, { origem: "link" | "manual"; veioDe?: string }>();
  let visitas = 0;
  let visitasSemIdentificacao = 0;
  let desde: string | null = null;

  for (const e of eventos) {
    if (!desde || e.created_at < desde) desde = e.created_at;

    if (e.tipo === "visita") {
      visitas += 1;
      if (!e.visitor_id) {
        // Navegador sem storage (aba anônima, cookies bloqueados): a visita
        // é real, mas não dá para saber se essa mesma pessoa voltou nem se
        // ela se cadastrou depois.
        visitasSemIdentificacao += 1;
        continue;
      }
      const atual = porVisitante.get(e.visitor_id);
      if (!atual) {
        porVisitante.set(e.visitor_id, {
          primeira: e.created_at,
          ultima: e.created_at,
          visitas: 1,
          origem: e.origem || "direto",
          dispositivo: e.dispositivo || "desconhecido",
        });
      } else {
        atual.visitas += 1;
        if (e.created_at < atual.primeira) atual.primeira = e.created_at;
        if (e.created_at > atual.ultima) atual.ultima = e.created_at;
      }
      continue;
    }

    if (e.tipo === "cadastro" || e.tipo === "cadastro_manual") {
      // Só o cadastro pelo link tem navegador por trás; o manual é feito
      // pelo representante, de outro dispositivo.
      if (e.tipo === "cadastro" && e.visitor_id) cadastraram.add(e.visitor_id);

      const email = (e.identificador || "").trim().toLowerCase();
      if (email) {
        const novo =
          e.tipo === "cadastro"
            ? { origem: "link" as const, veioDe: e.origem || undefined }
            : { origem: "manual" as const };
        // Na prática só existe um evento por e-mail (o segundo cadastro
        // com o mesmo e-mail é recusado pela turma). Se houver os dois, o
        // link ganha: a pessoa chegou a abrir a página.
        const atual = origemPorEmail.get(email);
        if (!atual || novo.origem === "link") origemPorEmail.set(email, novo);
      }
      continue;
    }

    if (CANAL_LABEL[e.tipo]) {
      envios.push({
        id: e.id,
        canal: CANAL_LABEL[e.tipo],
        quando: e.created_at,
      });
    }
  }

  const naoCadastraram: VisitanteSemCadastro[] = [];
  for (const [visitorId, v] of porVisitante) {
    if (cadastraram.has(visitorId)) continue;
    naoCadastraram.push({
      visitorId,
      apelido: apelidoDe(visitorId),
      primeira: v.primeira,
      ultima: v.ultima,
      visitas: v.visitas,
      origem: v.origem,
      dispositivo: v.dispositivo,
    });
  }
  naoCadastraram.sort((a, b) => (a.ultima > b.ultima ? -1 : 1));

  // Só conta quem primeiro apareceu como visita: um cadastro sem visita
  // correspondente (storage bloqueado no meio do caminho) não vira pessoa
  // nova nessa conta.
  let entraramECadastraram = 0;
  for (const visitorId of cadastraram) {
    if (porVisitante.has(visitorId)) entraramECadastraram += 1;
  }

  return {
    envios,
    visitas,
    pessoas: porVisitante.size,
    entraramECadastraram,
    naoCadastraram,
    visitasSemIdentificacao,
    desde,
    origemPorEmail,
  };
}

/**
 * Classifica uma linha da lista da turma.
 *
 * A checagem do e-mail do representante vem primeiro de propósito: a linha
 * dele nasce do cadastro da conta, não do link nem do painel — e essa
 * regra vale para as turmas antigas também, que são anteriores ao rastreio.
 */
export function origemDoCadastro(
  emailAluno: string,
  emailRepresentante: string,
  mapa: Rastreio["origemPorEmail"],
): { origem: OrigemCadastro; veioDe?: string } {
  const email = (emailAluno || "").trim().toLowerCase();
  if (email && email === (emailRepresentante || "").trim().toLowerCase()) {
    return { origem: "representante" };
  }
  const achado = mapa.get(email);
  if (achado) return { origem: achado.origem, veioDe: achado.veioDe };
  return { origem: "desconhecida" };
}

/** Alunos da turma, do mais recente para o mais antigo. */
export function alunosDaTurma(alunos: Student[], representativeId: string): Student[] {
  return alunos
    .filter((a) => a.representative_id === representativeId)
    .sort((a, b) => (a.created_at > b.created_at ? -1 : 1));
}
