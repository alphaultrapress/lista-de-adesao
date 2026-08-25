import { META_CONVITES, type Representative, type Student } from "@/lib/supabase";
import { diaISO } from "@/lib/admin/format";
import { STATUS_LABEL, type PainelDados, type StatusRep } from "@/lib/admin/data";

/* ──────────────────────────────────────────────────────────────────────────
   Recorte do relatório.

   A página só pinta; quem decide o que entra é este arquivo — assim o Excel,
   o PDF consolidado e a tabela mostram exatamente o mesmo conjunto. Nenhum
   número aqui é estimado: tudo sai de `representatives` e `students`.
   ────────────────────────────────────────────────────────────────────────── */

/** Sobre qual data o período incide. */
export type BaseData = "cadastro" | "adesao";

export type FiltroRelatorio = {
  q: string;
  curso: string;
  instituicao: string;
  uf: string;
  cidade: string;
  status: string;
  base: BaseData;
  /** Ano de quatro dígitos, ex. "2026". */
  ano: string;
  /** Mês com dois dígitos, ex. "08". */
  mes: string;
  /** Início do intervalo, `YYYY-MM-DD`. */
  de: string;
  /** Fim do intervalo, `YYYY-MM-DD`, inclusive. */
  ate: string;
  minConvites: string;
  minAdesoes: string;
};

export const FILTRO_VAZIO: FiltroRelatorio = {
  q: "",
  curso: "",
  instituicao: "",
  uf: "",
  cidade: "",
  status: "",
  base: "cadastro",
  ano: "",
  mes: "",
  de: "",
  ate: "",
  minConvites: "",
  minAdesoes: "",
};

export type TurmaRelatorio = {
  rep: Representative;
  status: StatusRep;
  /** Alunos da turma — já recortados pelo período quando a base é "adesao". */
  alunos: Student[];
  adesoes: number;
  convites: number;
  /** Telefone do representante: vem da adesão feita com o mesmo e-mail. */
  telefone: string;
  primeiraAdesao: string | null;
  ultimaAdesao: string | null;
  naMeta: boolean;
  atendida: boolean;
};

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const MES_LABEL = MESES.map((nome, i) => ({
  valor: String(i + 1).padStart(2, "0"),
  label: nome,
}));

/** O status de uma turma segue a mesma esteira do resto do painel. */
function statusDe(rep: Representative, convites: number, adesoes: number): StatusRep {
  if (rep.contacted_at) return "atendida";
  if (convites >= META_CONVITES) return "meta_atingida";
  if (adesoes > 0) return "em_andamento";
  const idade = Date.now() - new Date(rep.created_at).getTime();
  return idade < 7 * 86_400_000 ? "novo" : "pendente";
}

/** Um dia cai dentro da janela de ano/mês/intervalo? */
function dentroDoPeriodo(dia: string, f: FiltroRelatorio): boolean {
  if (!dia) return false;
  if (f.ano && dia.slice(0, 4) !== f.ano) return false;
  if (f.mes && dia.slice(5, 7) !== f.mes) return false;
  if (f.de && dia < f.de) return false;
  if (f.ate && dia > f.ate) return false;
  return true;
}

function temPeriodo(f: FiltroRelatorio): boolean {
  return Boolean(f.ano || f.mes || f.de || f.ate);
}

/**
 * Monta as linhas do relatório.
 *
 * Com base "adesao" o período recorta os alunos, não as turmas: os totais
 * passam a ser "quantos convites esta turma trouxe no período", e turma sem
 * nenhuma adesão na janela sai da lista. Com base "cadastro" o período filtra
 * a data de criação da turma e os totais são os históricos.
 */
export function filtrarRelatorio(dados: PainelDados, f: FiltroRelatorio): TurmaRelatorio[] {
  const termo = f.q.trim().toLowerCase();
  const minC = f.minConvites ? Number(f.minConvites) : null;
  const minA = f.minAdesoes ? Number(f.minAdesoes) : null;
  const janela = temPeriodo(f);

  const alunosPor = new Map<string, Student[]>();
  for (const a of dados.alunos) {
    const lista = alunosPor.get(a.representative_id);
    if (lista) lista.push(a);
    else alunosPor.set(a.representative_id, [a]);
  }

  const linhas: TurmaRelatorio[] = [];

  for (const rep of dados.representantes) {
    if (f.curso && rep.course_name !== f.curso) continue;
    if (f.instituicao && rep.institution_name !== f.instituicao) continue;
    if (f.uf && (rep.state ?? "") !== f.uf) continue;
    if (f.cidade && (rep.city ?? "") !== f.cidade) continue;

    if (termo) {
      const alvo = [
        rep.name,
        rep.email,
        rep.course_name,
        rep.institution_name,
        rep.city ?? "",
        rep.state ?? "",
        rep.consultant_name ?? "",
        rep.consultant_phone ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!alvo.includes(termo)) continue;
    }

    if (f.base === "cadastro" && janela && !dentroDoPeriodo(diaISO(rep.created_at), f)) {
      continue;
    }

    const todos = alunosPor.get(rep.id) ?? [];
    const alunos =
      f.base === "adesao" && janela
        ? todos.filter((a) => dentroDoPeriodo(diaISO(a.created_at), f))
        : todos;

    // Base "adesão" com janela: turma que não movimentou no período não é
    // assunto do relatório daquele mês.
    if (f.base === "adesao" && janela && alunos.length === 0) continue;

    const adesoes = alunos.length;
    const convites = alunos.reduce((s, a) => s + (a.qtd_convites || 0), 0);

    if (minC !== null && convites < minC) continue;
    if (minA !== null && adesoes < minA) continue;

    // O status é sempre o da turma inteira: recortar o período não "desfaz"
    // uma meta que ela já bateu.
    const convitesTotais = todos.reduce((s, a) => s + (a.qtd_convites || 0), 0);
    const status = statusDe(rep, convitesTotais, todos.length);
    if (f.status) {
      const bate =
        f.status === "meta_atingida" ? convitesTotais >= META_CONVITES : status === f.status;
      if (!bate) continue;
    }

    const datas = alunos.map((a) => a.created_at).sort();
    const email = (rep.email || "").toLowerCase();
    const doRep = todos.find((a) => (a.email || "").toLowerCase() === email && a.phone);

    linhas.push({
      rep,
      status,
      alunos: [...alunos].sort((a, b) => (a.created_at > b.created_at ? -1 : 1)),
      adesoes,
      convites,
      telefone: doRep?.phone ?? "",
      primeiraAdesao: datas[0] ?? null,
      ultimaAdesao: datas[datas.length - 1] ?? null,
      naMeta: convitesTotais >= META_CONVITES,
      atendida: Boolean(rep.contacted_at),
    });
  }

  return linhas;
}

export type ResumoRelatorio = {
  turmas: number;
  adesoes: number;
  convites: number;
  mediaConvites: number;
  naMeta: number;
  atendidas: number;
  semAdesao: number;
  percentualMeta: number;
};

export function resumoRelatorio(linhas: TurmaRelatorio[]): ResumoRelatorio {
  const turmas = linhas.length;
  const adesoes = linhas.reduce((s, l) => s + l.adesoes, 0);
  const convites = linhas.reduce((s, l) => s + l.convites, 0);
  const naMeta = linhas.filter((l) => l.naMeta).length;
  return {
    turmas,
    adesoes,
    convites,
    mediaConvites: turmas ? convites / turmas : 0,
    naMeta,
    atendidas: linhas.filter((l) => l.atendida).length,
    semAdesao: linhas.filter((l) => l.adesoes === 0).length,
    percentualMeta: turmas ? (naMeta / turmas) * 100 : 0,
  };
}

/** Quebra por curso — a leitura que a equipe comercial mais pede. */
export type Agrupado = { chave: string; turmas: number; adesoes: number; convites: number };

function agrupar(linhas: TurmaRelatorio[], chave: (l: TurmaRelatorio) => string): Agrupado[] {
  const mapa = new Map<string, Agrupado>();
  for (const l of linhas) {
    const k = chave(l) || "Não informado";
    const atual = mapa.get(k) ?? { chave: k, turmas: 0, adesoes: 0, convites: 0 };
    atual.turmas += 1;
    atual.adesoes += l.adesoes;
    atual.convites += l.convites;
    mapa.set(k, atual);
  }
  return Array.from(mapa.values()).sort((a, b) => b.convites - a.convites);
}

export function porCurso(linhas: TurmaRelatorio[]) {
  return agrupar(linhas, (l) => l.rep.course_name);
}

export function porInstituicao(linhas: TurmaRelatorio[]) {
  return agrupar(linhas, (l) => l.rep.institution_name);
}

export function porEstado(linhas: TurmaRelatorio[]) {
  return agrupar(linhas, (l) => l.rep.state ?? "");
}

export function porStatus(linhas: TurmaRelatorio[]) {
  return agrupar(linhas, (l) => STATUS_LABEL[l.status]);
}

/**
 * O corte que a equipe comercial cobra: quem já foi atendido e quem não foi.
 *
 * Fica separado do status porque "atendida" some do status quando a turma
 * ainda não bateu a meta — aqui a pergunta é só se houve contato.
 */
export function porAtendimento(linhas: TurmaRelatorio[]): Agrupado[] {
  const atendidas = linhas.filter((l) => l.atendida);
  const pendentes = linhas.filter((l) => !l.atendida);
  const soma = (chave: string, lista: TurmaRelatorio[]): Agrupado => ({
    chave,
    turmas: lista.length,
    adesoes: lista.reduce((s, l) => s + l.adesoes, 0),
    convites: lista.reduce((s, l) => s + l.convites, 0),
  });
  return [soma("Atendidas", atendidas), soma("Não atendidas", pendentes)];
}

/** Mês a mês, pela data que a base do filtro definiu. */
export function porMes(linhas: TurmaRelatorio[], base: BaseData): Agrupado[] {
  // As turmas entram por Set: na base "adesão" o mesmo mês recebe vários
  // alunos da mesma turma, e somar +1 por aluno inflaria a contagem.
  type Acumulado = Agrupado & { turmasNoMes: Set<string> };
  const mapa = new Map<string, Acumulado>();

  const pegar = (k: string): Acumulado => {
    const atual = mapa.get(k);
    if (atual) return atual;
    const novo: Acumulado = {
      chave: k,
      turmas: 0,
      adesoes: 0,
      convites: 0,
      turmasNoMes: new Set(),
    };
    mapa.set(k, novo);
    return novo;
  };

  for (const l of linhas) {
    if (base === "cadastro") {
      const mes = pegar(diaISO(l.rep.created_at).slice(0, 7));
      mes.turmasNoMes.add(l.rep.id);
      mes.adesoes += l.adesoes;
      mes.convites += l.convites;
    } else {
      for (const a of l.alunos) {
        const mes = pegar(diaISO(a.created_at).slice(0, 7));
        mes.turmasNoMes.add(l.rep.id);
        mes.adesoes += 1;
        mes.convites += a.qtd_convites || 0;
      }
    }
  }

  return Array.from(mapa.values())
    .map(({ turmasNoMes, ...g }) => ({ ...g, turmas: turmasNoMes.size }))
    .sort((a, b) => (a.chave < b.chave ? -1 : 1));
}

/** `2026-08` → `Agosto/2026`, para os cabeçalhos das exportações. */
export function rotuloMes(chave: string): string {
  const [ano, mes] = chave.split("-");
  const nome = MESES[Number(mes) - 1];
  return nome ? `${nome}/${ano}` : chave;
}

/** Descrição textual do recorte — vai no topo do PDF e na aba de resumo. */
export function descreverFiltro(f: FiltroRelatorio): string[] {
  const partes: string[] = [];
  if (f.q) partes.push(`Busca: ${f.q}`);
  if (f.curso) partes.push(`Curso: ${f.curso}`);
  if (f.instituicao) partes.push(`Instituição: ${f.instituicao}`);
  if (f.uf) partes.push(`Estado: ${f.uf}`);
  if (f.cidade) partes.push(`Cidade: ${f.cidade}`);
  if (f.status) partes.push(`Status: ${STATUS_LABEL[f.status as StatusRep] ?? f.status}`);
  if (f.minConvites) partes.push(`Convites ≥ ${f.minConvites}`);
  if (f.minAdesoes) partes.push(`Adesões ≥ ${f.minAdesoes}`);

  const periodo: string[] = [];
  if (f.ano) periodo.push(f.ano);
  if (f.mes) periodo.push(MES_LABEL.find((m) => m.valor === f.mes)?.label ?? f.mes);
  if (f.de) periodo.push(`de ${f.de.split("-").reverse().join("/")}`);
  if (f.ate) periodo.push(`até ${f.ate.split("-").reverse().join("/")}`);
  if (periodo.length) {
    const base = f.base === "adesao" ? "Adesões" : "Cadastro";
    partes.push(`${base}: ${periodo.join(" · ")}`);
  }

  return partes.length ? partes : ["Sem filtros — base completa"];
}
