import type { Row, Sheet, SheetData } from "write-excel-file/browser";
import { META_CONVITES } from "@/lib/supabase";
import { maskCpf, maskPhone } from "@/lib/cpf";
import { STATUS_LABEL } from "@/lib/admin/data";
import {
  descreverFiltro,
  porAtendimento,
  porCurso,
  porEstado,
  porInstituicao,
  porMes,
  porStatus,
  resumoRelatorio,
  rotuloMes,
  type Agrupado,
  type FiltroRelatorio,
  type TurmaRelatorio,
} from "@/lib/admin/relatorio";

/* ──────────────────────────────────────────────────────────────────────────
   Planilha do relatório (.xlsx de verdade, não CSV renomeado).

   Abas: Resumo, Turmas, Alunos, Turma a turma e as quebras. Tudo o que sai aqui
   é o mesmo recorte que a tela mostra — quem filtra é `filtrarRelatorio`.
   ────────────────────────────────────────────────────────────────────────── */

const TINTA = "#1A1410";
const AREIA = "#F5F1E9";

const CABECALHO = {
  fontWeight: "bold" as const,
  textColor: "#FFFFFF",
  backgroundColor: TINTA,
  align: "left" as const,
  height: 22,
};

const TITULO = { fontWeight: "bold" as const, fontSize: 14, textColor: TINTA };
const ROTULO = { fontWeight: "bold" as const, textColor: "#6F716B" };

/**
 * `Date` com a hora de São Paulo já embutida.
 *
 * A lib converte `Date` para serial do Excel direto do epoch, ou seja, em UTC.
 * Uma adesão feita 23h no Brasil apareceria no dia seguinte. Reconstruir a
 * data a partir das partes locais resolve — o Excel guarda data "sem fuso".
 */
function dataExcel(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const parte = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return new Date(
    Date.UTC(parte("year"), parte("month") - 1, parte("day"), parte("hour"), parte("minute")),
  );
}

function texto(valor: string | null | undefined) {
  return { value: valor || "", type: String };
}

function numero(valor: number) {
  return { value: valor, type: Number };
}

function dataHora(iso: string | null | undefined) {
  const d = dataExcel(iso);
  return d ? { value: d, type: Date, format: "dd/mm/yyyy hh:mm" } : { value: "", type: String };
}

function data(iso: string | null | undefined) {
  const d = dataExcel(iso);
  return d ? { value: d, type: Date, format: "dd/mm/yyyy" } : { value: "", type: String };
}

function cabecalho(colunas: string[]): Row {
  return colunas.map((c) => ({ value: c, ...CABECALHO })) as Row;
}

/** Uma aba de quebra (por curso, por estado…) tem sempre o mesmo formato. */
function abaAgrupada(
  nome: string,
  rotuloChave: string,
  dados: Agrupado[],
  formatarChave: (c: string) => string = (c) => c,
): Sheet<Blob> {
  const linhas: SheetData = [
    cabecalho([rotuloChave, "Turmas", "Alunos", "Convites", "Convites por turma"]),
    ...dados.map(
      (g) =>
        [
          texto(formatarChave(g.chave)),
          numero(g.turmas),
          numero(g.adesoes),
          numero(g.convites),
          { value: g.turmas ? g.convites / g.turmas : 0, type: Number, format: "0.0" },
        ] as Row,
    ),
  ];

  if (dados.length) {
    const t = dados.reduce(
      (s, g) => ({
        turmas: s.turmas + g.turmas,
        adesoes: s.adesoes + g.adesoes,
        convites: s.convites + g.convites,
      }),
      { turmas: 0, adesoes: 0, convites: 0 },
    );
    linhas.push([
      { value: "Total", fontWeight: "bold", backgroundColor: AREIA },
      { value: t.turmas, type: Number, fontWeight: "bold", backgroundColor: AREIA },
      { value: t.adesoes, type: Number, fontWeight: "bold", backgroundColor: AREIA },
      { value: t.convites, type: Number, fontWeight: "bold", backgroundColor: AREIA },
      { value: "", backgroundColor: AREIA },
    ] as Row);
  }

  return {
    sheet: nome,
    data: linhas,
    columns: [{ width: 42 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 20 }],
    stickyRowsCount: 1,
  };
}

export type PlanilhaParams = {
  linhas: TurmaRelatorio[];
  filtro: FiltroRelatorio;
  /** Origem do site, para montar o link público de cada turma. */
  baseUrl: string;
};

export async function baixarRelatorioXlsx({ linhas, filtro, baseUrl }: PlanilhaParams) {
  // A lib é pesada e só serve aqui: carregar sob demanda mantém o bundle da
  // página do tamanho que era.
  const writeXlsxFile = (await import("write-excel-file/browser")).default;

  const resumo = resumoRelatorio(linhas);
  const geradoEm = dataExcel(new Date().toISOString());

  /* ── aba 1: resumo ── */
  const abaResumo: SheetData = [
    [{ value: "Relatório das turmas · Alpha Convites", ...TITULO, columnSpan: 2 }, null] as Row,
    [
      { value: "Gerado em", ...ROTULO },
      geradoEm
        ? { value: geradoEm, type: Date, format: "dd/mm/yyyy hh:mm" }
        : { value: "", type: String },
    ] as Row,
    [] as Row,
    [{ value: "O que está neste relatório", fontWeight: "bold", textColor: TINTA }] as Row,
    [texto(`Mostrando ${descreverFiltro(filtro).join(", ")}.`)] as Row,
    [] as Row,
    [{ value: "Resumo em números", fontWeight: "bold", textColor: TINTA }] as Row,
    ...(
      [
        ["Turmas", resumo.turmas],
        ["Alunos", resumo.adesoes],
        ["Convites", resumo.convites],
        ["Convites por turma (média)", Number(resumo.mediaConvites.toFixed(1))],
        [`Turmas que bateram a meta (${META_CONVITES} convites)`, resumo.naMeta],
        ["Turmas com quem já falamos", resumo.atendidas],
        ["Turmas sem nenhum aluno", resumo.semAdesao],
        ["Quantas por cento bateram a meta", Number(resumo.percentualMeta.toFixed(1))],
      ] as [string, number][]
    ).map(([label, valor]) => [{ value: label, ...ROTULO }, numero(valor)] as Row),
  ];

  /* ── aba 2: turmas ── */
  const abaTurmas: SheetData = [
    cabecalho([
      "Representante",
      "E-mail",
      "WhatsApp",
      "Curso",
      "Instituição",
      "Ano/Período",
      "Cidade",
      "UF",
      "Situação",
      "Já falamos?",
      "Bateu a meta?",
      "Convites",
      "Alunos",
      "Faltam para a meta",
      "Turma criada em",
      "Primeiro aluno entrou em",
      "Último aluno entrou em",
      "Falamos em",
      "Lead gerado em",
      "Avisamos da meta em",
      "Consultor",
      "Telefone do consultor",
      "Link da lista",
      "ID",
    ]),
    ...linhas.map(
      (l) =>
        [
          texto(l.rep.name),
          texto(l.rep.email),
          texto(l.telefone ? maskPhone(l.telefone) : ""),
          texto(l.rep.course_name),
          texto(l.rep.institution_name),
          texto(l.rep.graduation_year),
          texto(l.rep.city),
          texto(l.rep.state),
          texto(STATUS_LABEL[l.status]),
          texto(l.atendida ? "Sim" : "Não"),
          texto(l.naMeta ? "Sim" : "Não"),
          numero(l.convites),
          numero(l.adesoes),
          numero(Math.max(0, META_CONVITES - l.convites)),
          dataHora(l.rep.created_at),
          dataHora(l.primeiraAdesao),
          dataHora(l.ultimaAdesao),
          dataHora(l.rep.contacted_at),
          dataHora(l.rep.lead_created_at),
          dataHora(l.rep.meta_notified_at),
          texto(l.rep.consultant_name),
          texto(l.rep.consultant_phone ? maskPhone(l.rep.consultant_phone) : ""),
          texto(`${baseUrl}/adesao/${l.rep.slug}`),
          texto(l.rep.id),
        ] as Row,
    ),
  ];

  /* ── aba 3: alunos ── */
  const abaAlunos: SheetData = [
    cabecalho([
      "Aluno",
      "CPF",
      "Nascimento",
      "E-mail",
      "WhatsApp",
      "Convites",
      "Entrou em",
      "Curso",
      "Instituição",
      "Ano/Período",
      "Representante",
      "Cidade",
      "UF",
      "ID do aluno",
    ]),
    ...linhas.flatMap((l) =>
      l.alunos.map(
        (a) =>
          [
            texto(a.full_name),
            texto(a.cpf ? maskCpf(a.cpf) : ""),
            data(a.birth_date),
            texto(a.email),
            texto(a.phone ? maskPhone(a.phone) : ""),
            numero(a.qtd_convites || 0),
            dataHora(a.created_at),
            texto(l.rep.course_name),
            texto(l.rep.institution_name),
            texto(l.rep.graduation_year),
            texto(l.rep.name),
            texto(l.rep.city),
            texto(l.rep.state),
            texto(a.id),
          ] as Row,
      ),
    ),
  ];

  /* ── aba 4: turma a turma ──
     A leitura "de olho": cada representante em uma faixa escura e, logo
     abaixo, os alunos que ele trouxe, numerados. É a mesma lista da tela,
     só que impressa em ordem. */
  const abaTurmaATurma: SheetData = [];
  for (const l of linhas) {
    abaTurmaATurma.push([
      {
        value: `${l.rep.course_name} · ${l.rep.institution_name} · ${l.rep.graduation_year}`,
        ...CABECALHO,
        columnSpan: 3,
      },
      // As células engolidas pelo `columnSpan` precisam existir como `null`.
      null,
      null,
      { value: `${l.convites} convites`, ...CABECALHO, align: "right" },
      { value: `${l.adesoes} alunos`, ...CABECALHO, align: "right" },
      {
        value: l.atendida ? "JÁ FALAMOS" : STATUS_LABEL[l.status].toUpperCase(),
        ...CABECALHO,
        align: "right",
      },
    ] as Row);
    abaTurmaATurma.push([
      { value: "Representante", ...ROTULO },
      { value: l.rep.name, fontWeight: "bold", columnSpan: 2 },
      null,
      texto(l.rep.email),
      texto(l.telefone ? maskPhone(l.telefone) : ""),
      texto(
        [l.rep.city, l.rep.state].filter(Boolean).join("/") || "Local não informado",
      ),
    ] as Row);

    if (l.alunos.length === 0) {
      abaTurmaATurma.push([
        { value: "Nenhum aluno entrou nesta turma nas datas escolhidas.", textColor: "#6F716B" },
      ] as Row);
    } else {
      abaTurmaATurma.push(
        [
          { value: "#", ...ROTULO, backgroundColor: AREIA },
          { value: "Aluno", ...ROTULO, backgroundColor: AREIA },
          { value: "CPF", ...ROTULO, backgroundColor: AREIA },
          { value: "E-mail", ...ROTULO, backgroundColor: AREIA },
          { value: "WhatsApp", ...ROTULO, backgroundColor: AREIA },
          { value: "Convites", ...ROTULO, backgroundColor: AREIA },
          { value: "Entrou em", ...ROTULO, backgroundColor: AREIA },
        ] as Row,
      );
      l.alunos.forEach((a, i) => {
        abaTurmaATurma.push([
          numero(i + 1),
          texto(a.full_name),
          texto(a.cpf ? maskCpf(a.cpf) : ""),
          texto(a.email),
          texto(a.phone ? maskPhone(a.phone) : ""),
          numero(a.qtd_convites || 0),
          dataHora(a.created_at),
        ] as Row);
      });
    }
    abaTurmaATurma.push([] as Row);
  }

  const abas: Sheet<Blob>[] = [
    {
      sheet: "Resumo",
      data: abaResumo,
      columns: [{ width: 34 }, { width: 26 }],
      showGridLines: false,
    },
    {
      sheet: "Turmas",
      data: abaTurmas,
      stickyRowsCount: 1,
      columns: [
        { width: 30 }, { width: 32 }, { width: 18 }, { width: 26 }, { width: 38 },
        { width: 14 }, { width: 20 }, { width: 8 }, { width: 16 }, { width: 11 },
        { width: 10 }, { width: 11 }, { width: 11 }, { width: 18 }, { width: 18 },
        { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 20 },
        { width: 22 }, { width: 20 }, { width: 46 }, { width: 38 },
      ],
    },
    {
      sheet: "Alunos",
      data: abaAlunos,
      stickyRowsCount: 1,
      columns: [
        { width: 32 }, { width: 18 }, { width: 14 }, { width: 32 }, { width: 18 },
        { width: 11 }, { width: 18 }, { width: 26 }, { width: 38 }, { width: 14 },
        { width: 30 }, { width: 20 }, { width: 8 }, { width: 38 },
      ],
    },
    {
      sheet: "Turma a turma",
      data: abaTurmaATurma,
      showGridLines: false,
      columns: [
        { width: 6 }, { width: 34 }, { width: 18 }, { width: 32 },
        { width: 18 }, { width: 12 }, { width: 18 },
      ],
    },
    // Nome de aba no Excel não aceita : \ / ? * [ ] — nada de "?" aqui.
    abaAgrupada("Já falamos", "Resposta", porAtendimento(linhas)),
    abaAgrupada("Situação das turmas", "Situação", porStatus(linhas)),
    abaAgrupada("Cursos", "Curso", porCurso(linhas)),
    abaAgrupada("Instituições", "Instituição", porInstituicao(linhas)),
    abaAgrupada("Estados", "Estado", porEstado(linhas)),
    abaAgrupada("Mês a mês", "Mês", porMes(linhas, filtro.base), rotuloMes),
  ];

  await writeXlsxFile(abas, { fontFamily: "Calibri", fontSize: 11 }).toFile(
    `relatorio-turmas-${new Date().toISOString().slice(0, 10)}.xlsx`,
  );
}
