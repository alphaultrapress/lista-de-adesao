"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useLoadingGate } from "@/components/ui/LoadingScreen";
import { ErroBloco, Painel, StatusBadge, Vazio } from "@/components/admin/Primitivos";
import { signOutAndClearSession, supabase, META_CONVITES } from "@/lib/supabase";
import { maskPhone } from "@/lib/cpf";
import { ADM, RADIUS } from "@/lib/admin/tokens";
import { dataAdmin, diaISO, hojeISO, numero } from "@/lib/admin/format";
import { carregarPainel, STATUS_LABEL, type PainelDados, type StatusRep } from "@/lib/admin/data";
import {
  descreverFiltro,
  filtrarRelatorio,
  FILTRO_VAZIO,
  MES_LABEL,
  porAtendimento,
  porCurso,
  porEstado,
  porMes,
  porStatus,
  resumoRelatorio,
  rotuloMes,
  type Agrupado,
  type FiltroRelatorio,
  type TurmaRelatorio,
} from "@/lib/admin/relatorio";
import { baixarRelatorioXlsx } from "@/lib/admin/relatorioXlsx";

/* ──────────────────────────────────────────────────────────────────────────
   Relatórios.

   A tela é a mesma verdade das exportações: o que está na tabela é o que sai
   no Excel e no PDF. Os filtros ficam em estado local — relatório é sessão de
   trabalho, não link para compartilhar.
   ────────────────────────────────────────────────────────────────────────── */

const STATUS_FILTRAVEIS: StatusRep[] = [
  "novo",
  "em_andamento",
  "pendente",
  "meta_atingida",
  "atendida",
];

/** Atalhos que só preenchem `de`/`ate` — o resto do período continua manual. */
function atalhos(): { label: string; valores: Partial<FiltroRelatorio> }[] {
  const hoje = hojeISO();
  const [ano, mes] = hoje.split("-");
  const recuar = (dias: number) =>
    diaISO(new Date(Date.now() - dias * 86_400_000));
  const mesPassado = new Date(Number(ano), Number(mes) - 2, 1);
  const mpAno = String(mesPassado.getFullYear());
  const mpMes = String(mesPassado.getMonth() + 1).padStart(2, "0");

  return [
    { label: "Hoje", valores: { de: hoje, ate: hoje, ano: "", mes: "" } },
    { label: "7 dias", valores: { de: recuar(6), ate: hoje, ano: "", mes: "" } },
    { label: "30 dias", valores: { de: recuar(29), ate: hoje, ano: "", mes: "" } },
    { label: "Este mês", valores: { ano, mes, de: "", ate: "" } },
    { label: "Mês passado", valores: { ano: mpAno, mes: mpMes, de: "", ate: "" } },
    { label: "Este ano", valores: { ano, mes: "", de: "", ate: "" } },
  ];
}

const campo = {
  height: 38,
  borderRadius: RADIUS,
  border: `1px solid ${ADM.border}`,
  background: ADM.bg,
  color: ADM.text,
} as const;

export default function RelatoriosPage() {
  const router = useRouter();

  const [dados, setDados] = useState<PainelDados | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | undefined>();
  const [filtro, setFiltro] = useState<FiltroRelatorio>(FILTRO_VAZIO);
  const [selecao, setSelecao] = useState<Set<string>>(new Set());
  const [aberta, setAberta] = useState<string | null>(null);
  const [exportando, setExportando] = useState<string | null>(null);
  const [lote, setLote] = useState<{ feito: number; total: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        router.replace("/admin/login");
        return;
      }
      const { data: admin } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!admin) {
        await signOutAndClearSession();
        router.replace("/admin/login");
        return;
      }
      try {
        setDados(await carregarPainel());
      } catch (err: any) {
        setErro(err?.message || "Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const { mostrando: carregandoTela, tela } = useLoadingGate(loading);

  const opcoes = useMemo(() => {
    const reps = dados?.representantes ?? [];
    const unicos = (v: (string | null | undefined)[]) =>
      Array.from(new Set(v.filter(Boolean) as string[])).sort();
    const anos = Array.from(
      new Set(reps.map((r) => diaISO(r.created_at).slice(0, 4)).filter(Boolean)),
    ).sort((a, b) => (a > b ? -1 : 1));
    return {
      cursos: unicos(reps.map((r) => r.course_name)),
      inst: unicos(reps.map((r) => r.institution_name)),
      ufs: unicos(reps.map((r) => r.state)),
      cidades: unicos(reps.map((r) => r.city)),
      anos,
    };
  }, [dados]);

  const linhas = useMemo(
    () => (dados ? filtrarRelatorio(dados, filtro) : []),
    [dados, filtro],
  );

  const resumo = useMemo(() => resumoRelatorio(linhas), [linhas]);
  const quebras = useMemo(() => {
    const igual = (c: string) => c;
    const cursos = porCurso(linhas);
    const estados = porEstado(linhas);
    /** Painel que corta no top N avisa quanto ficou de fora. */
    const nota = (mostrados: number, total: number) =>
      total > mostrados ? `${mostrados} de ${total}` : undefined;

    return [
      {
        titulo: "Atendimento",
        coluna: "Situação",
        dados: porAtendimento(linhas),
        rotulo: igual,
      },
      { titulo: "Status", coluna: "Status", dados: porStatus(linhas), rotulo: igual },
      {
        titulo: "Cursos",
        coluna: "Curso",
        dados: cursos.slice(0, 8),
        rotulo: igual,
        nota: nota(Math.min(8, cursos.length), cursos.length),
      },
      {
        titulo: "Estados",
        coluna: "Estado",
        dados: estados.slice(0, 8),
        rotulo: igual,
        nota: nota(Math.min(8, estados.length), estados.length),
      },
      {
        titulo: "Mês a mês",
        coluna: "Mês",
        dados: porMes(linhas, filtro.base),
        rotulo: rotuloMes,
      },
    ] as {
      titulo: string;
      coluna: string;
      dados: Agrupado[];
      rotulo: (c: string) => string;
      nota?: string;
    }[];
  }, [linhas, filtro.base]);

  const set = (mudanca: Partial<FiltroRelatorio>) =>
    setFiltro((f) => ({ ...f, ...mudanca }));

  const filtroAtivo = useMemo(
    () => JSON.stringify(filtro) !== JSON.stringify(FILTRO_VAZIO),
    [filtro],
  );

  /* As selecionadas mandam no lote; sem seleção, o lote é o recorte inteiro. */
  const alvoLote = useMemo(
    () => (selecao.size ? linhas.filter((l) => selecao.has(l.rep.id)) : linhas),
    [linhas, selecao],
  );

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  /* ─────────────────────────────── exportações ─────────────────────────── */

  async function exportarExcel() {
    setExportando("xlsx");
    setErro(undefined);
    try {
      await baixarRelatorioXlsx({ linhas, filtro, baseUrl });
    } catch (err: any) {
      setErro(err?.message || "Não foi possível gerar a planilha.");
    } finally {
      setExportando(null);
    }
  }

  async function exportarPdf() {
    setExportando("pdf");
    setErro(undefined);
    try {
      const { baixarRelatorioPdf } = await import("@/lib/admin/relatorioPdf");
      await baixarRelatorioPdf({ linhas, filtro });
    } catch (err: any) {
      setErro(err?.message || "Não foi possível gerar o PDF.");
    } finally {
      setExportando(null);
    }
  }

  /** PDF individual da turma — o mesmo layout do lead. */
  async function pdfDaTurma(l: TurmaRelatorio) {
    setExportando(l.rep.id);
    setErro(undefined);
    try {
      const { buildLeadPdf } = await import("@/lib/leadPdf");
      const { doc, slug } = await buildLeadPdf({
        curso: l.rep.course_name,
        instituicao: l.rep.institution_name,
        ano: l.rep.graduation_year,
        representanteNome: l.rep.name,
        representanteEmail: l.rep.email,
        representanteTelefone: l.telefone || undefined,
        students: l.alunos.map((a) => ({
          full_name: a.full_name,
          email: a.email,
          phone: a.phone,
          qtd_convites: a.qtd_convites,
        })),
      });
      doc.save(`turma-${slug}.pdf`);
    } catch (err: any) {
      setErro(err?.message || "Não foi possível gerar o PDF da turma.");
    } finally {
      setExportando(null);
    }
  }

  /**
   * Lote: um arquivo por turma, em sequência.
   *
   * O navegador trata vários downloads seguidos como pop-up e pode pedir
   * permissão na primeira vez — por isso o aviso no rodapé do botão.
   */
  async function pdfEmLote() {
    if (alvoLote.length === 0) return;
    setErro(undefined);
    setLote({ feito: 0, total: alvoLote.length });
    try {
      const { buildLeadPdf } = await import("@/lib/leadPdf");
      for (let i = 0; i < alvoLote.length; i++) {
        const l = alvoLote[i];
        const { doc, slug } = await buildLeadPdf({
          curso: l.rep.course_name,
          instituicao: l.rep.institution_name,
          ano: l.rep.graduation_year,
          representanteNome: l.rep.name,
          representanteEmail: l.rep.email,
          representanteTelefone: l.telefone || undefined,
          students: l.alunos.map((a) => ({
            full_name: a.full_name,
            email: a.email,
            phone: a.phone,
            qtd_convites: a.qtd_convites,
          })),
        });
        doc.save(`turma-${slug}.pdf`);
        setLote({ feito: i + 1, total: alvoLote.length });
        // Respiro entre os downloads: sem ele o navegador engole os últimos.
        await new Promise((r) => setTimeout(r, 350));
      }
    } catch (err: any) {
      setErro(err?.message || "Não foi possível gerar os PDFs em lote.");
    } finally {
      setTimeout(() => setLote(null), 1200);
    }
  }

  /* ────────────────────────────────── UI ───────────────────────────────── */

  if (carregandoTela) return tela;

  const Rotulo = ({ children }: { children: React.ReactNode }) => (
    <span
      className="mb-1 block text-[10.5px] font-semibold uppercase"
      style={{ letterSpacing: "0.07em", color: ADM.textMuted }}
    >
      {children}
    </span>
  );

  const botao = (ativo: boolean) => ({
    height: 38,
    borderRadius: RADIUS,
    border: `1px solid ${ativo ? ADM.ink : ADM.border}`,
    background: ativo ? ADM.ink : ADM.surface,
    color: ativo ? "#FFFFFF" : ADM.text,
  });

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="font-semibold"
            style={{ fontSize: 22, letterSpacing: "-0.02em", color: ADM.text }}
          >
            Relatórios
          </h1>
          <p className="mt-1.5 text-[13.5px]" style={{ color: ADM.textMuted }}>
            {descreverFiltro(filtro).join(" · ")} — {numero(resumo.turmas)}{" "}
            {resumo.turmas === 1 ? "turma" : "turmas"}, {numero(resumo.adesoes)}{" "}
            {resumo.adesoes === 1 ? "adesão" : "adesões"}, {numero(resumo.convites)} convites.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportarExcel}
            disabled={exportando !== null || linhas.length === 0}
            className="inline-flex items-center gap-2 px-3.5 text-[13px] font-medium disabled:opacity-50"
            style={botao(false)}
          >
            {exportando === "xlsx" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={15} strokeWidth={1.8} />
            )}
            Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={exportarPdf}
            disabled={exportando !== null || linhas.length === 0}
            className="inline-flex items-center gap-2 px-3.5 text-[13px] font-medium disabled:opacity-50"
            style={botao(false)}
          >
            {exportando === "pdf" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileText size={15} strokeWidth={1.8} />
            )}
            PDF consolidado
          </button>
          <button
            type="button"
            onClick={pdfEmLote}
            disabled={lote !== null || alvoLote.length === 0}
            className="inline-flex items-center gap-2 px-3.5 text-[13px] font-medium disabled:opacity-50"
            style={botao(true)}
            title="Gera um PDF para cada turma, em sequência."
          >
            {lote ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileDown size={15} strokeWidth={1.8} />
            )}
            {lote
              ? `Baixando ${lote.feito}/${lote.total}`
              : `PDF por turma (${alvoLote.length})`}
          </button>
        </div>
      </header>

      {erro && (
        <div className="mb-5">
          <ErroBloco mensagem={erro} />
        </div>
      )}

      {/* ── filtros ── */}
      <Painel padding={false} className="mb-6">
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
          style={{ borderBottom: `1px solid ${ADM.border}` }}
        >
          <span
            className="inline-flex items-center gap-2 text-[13px] font-semibold"
            style={{ color: ADM.text }}
          >
            <Filter size={14} strokeWidth={1.8} />
            Filtros
          </span>
          {filtroAtivo && (
            <button
              type="button"
              onClick={() => {
                setFiltro(FILTRO_VAZIO);
                setSelecao(new Set());
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium"
              style={{ borderRadius: 999, border: `1px solid ${ADM.border}`, color: ADM.textMuted }}
            >
              <RotateCcw size={12} strokeWidth={1.8} />
              Limpar filtros
            </button>
          )}
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="sm:col-span-2">
            <Rotulo>Busca</Rotulo>
            <input
              value={filtro.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Nome, e-mail, curso, instituição, cidade"
              className="w-full px-3 text-[13px] outline-none"
              style={campo}
            />
          </div>
          {[
            { k: "curso" as const, label: "Curso", ops: opcoes.cursos },
            { k: "instituicao" as const, label: "Instituição", ops: opcoes.inst },
            { k: "uf" as const, label: "Estado", ops: opcoes.ufs },
            { k: "cidade" as const, label: "Cidade", ops: opcoes.cidades },
          ].map((s) => (
            <div key={s.k}>
              <Rotulo>{s.label}</Rotulo>
              <select
                value={filtro[s.k]}
                onChange={(e) => set({ [s.k]: e.target.value } as Partial<FiltroRelatorio>)}
                className="w-full px-3 text-[13px] outline-none"
                style={{ ...campo, color: filtro[s.k] ? ADM.text : ADM.textMuted }}
              >
                <option value="">Todos</option>
                {s.ops.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div>
            <Rotulo>Status</Rotulo>
            <select
              value={filtro.status}
              onChange={(e) => set({ status: e.target.value })}
              className="w-full px-3 text-[13px] outline-none"
              style={{ ...campo, color: filtro.status ? ADM.text : ADM.textMuted }}
            >
              <option value="">Todos</option>
              {STATUS_FILTRAVEIS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

          <div className="mt-5 border-t pt-4" style={{ borderColor: ADM.border }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span
                className="text-[11px] font-semibold uppercase"
                style={{ letterSpacing: "0.07em", color: ADM.textMuted }}
              >
                Período e volume
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {atalhos().map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => set(a.valores)}
                    className="px-3 py-1.5 text-[12px] font-medium"
                    style={{
                      borderRadius: 999,
                      border: `1px solid ${ADM.border}`,
                      background: ADM.bg,
                      color: ADM.text,
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <div>
                <Rotulo>A data é a de</Rotulo>
            <select
              value={filtro.base}
              onChange={(e) => set({ base: e.target.value as FiltroRelatorio["base"] })}
              className="w-full px-3 text-[13px] outline-none"
              style={campo}
            >
              <option value="cadastro">Cadastro da turma</option>
              <option value="adesao">Adesões dos alunos</option>
            </select>
          </div>
          <div>
            <Rotulo>Ano</Rotulo>
            <select
              value={filtro.ano}
              onChange={(e) => set({ ano: e.target.value })}
              className="w-full px-3 text-[13px] outline-none"
              style={{ ...campo, color: filtro.ano ? ADM.text : ADM.textMuted }}
            >
              <option value="">Todos</option>
              {opcoes.anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Rotulo>Mês</Rotulo>
            <select
              value={filtro.mes}
              onChange={(e) => set({ mes: e.target.value })}
              className="w-full px-3 text-[13px] outline-none"
              style={{ ...campo, color: filtro.mes ? ADM.text : ADM.textMuted }}
            >
              <option value="">Todos</option>
              {MES_LABEL.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Rotulo>De (dia)</Rotulo>
            <input
              type="date"
              value={filtro.de}
              onChange={(e) => set({ de: e.target.value })}
              className="w-full px-3 text-[13px] outline-none"
              style={campo}
            />
          </div>
          <div>
            <Rotulo>Até (dia)</Rotulo>
            <input
              type="date"
              value={filtro.ate}
              onChange={(e) => set({ ate: e.target.value })}
              className="w-full px-3 text-[13px] outline-none"
              style={campo}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Rotulo>Convites ≥</Rotulo>
              <input
                type="number"
                min={0}
                value={filtro.minConvites}
                onChange={(e) => set({ minConvites: e.target.value })}
                placeholder="0"
                className="w-full px-3 text-[13px] outline-none"
                style={campo}
              />
            </div>
            <div>
              <Rotulo>Adesões ≥</Rotulo>
              <input
                type="number"
                min={0}
                value={filtro.minAdesoes}
                onChange={(e) => set({ minAdesoes: e.target.value })}
                placeholder="0"
                className="w-full px-3 text-[13px] outline-none"
                style={campo}
              />
            </div>
              </div>
            </div>
          </div>
        </div>
      </Painel>

      {/* ── números do recorte ── */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold" style={{ color: ADM.text }}>
          Números do recorte
        </h2>
        <span className="text-[12px]" style={{ color: ADM.textMuted }}>
          {filtro.base === "adesao"
            ? "Contando só as adesões dentro do período"
            : "Totais históricos das turmas do recorte"}
        </span>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {(
          [
            ["Turmas", numero(resumo.turmas), ""],
            ["Adesões", numero(resumo.adesoes), ""],
            ["Convites", numero(resumo.convites), ""],
            ["Média por turma", resumo.mediaConvites.toFixed(1), "convites"],
            ["Na meta", numero(resumo.naMeta), `de ${META_CONVITES} convites`],
            ["Atendidas", numero(resumo.atendidas), "com contato"],
            ["Não atendidas", numero(resumo.turmas - resumo.atendidas), "aguardando"],
            ["Sem adesão", numero(resumo.semAdesao), "nenhuma lista"],
          ] as [string, string, string][]
        ).map(([label, valor, apoio]) => (
          <div
            key={label}
            style={{
              background: ADM.surface,
              border: `1px solid ${ADM.border}`,
              borderRadius: RADIUS,
              padding: 14,
            }}
          >
            <span
              className="block text-[10.5px] font-semibold uppercase"
              style={{ letterSpacing: "0.07em", color: ADM.textMuted }}
            >
              {label}
            </span>
            <span
              className="mt-1 block font-semibold"
              style={{ fontSize: 21, letterSpacing: "-0.02em", color: ADM.text }}
            >
              {valor}
            </span>
            {apoio && (
              <span className="mt-0.5 block text-[11.5px]" style={{ color: ADM.textMuted }}>
                {apoio}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── quebras ── */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold" style={{ color: ADM.text }}>
          Quebras do recorte
        </h2>
        <span className="text-[12px]" style={{ color: ADM.textMuted }}>
          Convites em destaque · ordenado do maior para o menor
        </span>
      </div>
      <div className="mb-6 grid grid-cols-1 items-start gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {quebras.map((q) => (
          <Painel key={q.titulo} padding={false}>
            <div
              className="flex items-baseline justify-between gap-2 px-4 py-3"
              style={{ borderBottom: `1px solid ${ADM.border}` }}
            >
              <span className="text-[13px] font-semibold" style={{ color: ADM.text }}>
                {q.titulo}
              </span>
              {q.nota && (
                <span className="shrink-0 text-[11.5px]" style={{ color: ADM.textMuted }}>
                  {q.nota}
                </span>
              )}
            </div>
            {q.dados.length === 0 ? (
              <p className="px-4 py-4 text-[12.5px]" style={{ color: ADM.textMuted }}>
                Nada no recorte.
              </p>
            ) : (
              /* `table-fixed` + colgroup: as três colunas de número têm largura
                 travada, então sobra o resto para o rótulo em vez de ele ser
                 espremido até virar reticências. */
              <table className="w-full table-fixed">
                <colgroup>
                  <col />
                  <col style={{ width: 62 }} />
                  <col style={{ width: 68 }} />
                  <col style={{ width: 76 }} />
                </colgroup>
                <thead>
                  <tr>
                    {[q.coluna, "Turmas", "Adesões", "Convites"].map((c, i) => (
                      <th
                        key={c}
                        className={`px-4 py-2 text-[10px] font-semibold uppercase ${
                          i === 0 ? "text-left" : "pl-0 pr-3 text-right"
                        }`}
                        style={{
                          letterSpacing: "0.07em",
                          color: ADM.textMuted,
                          borderBottom: `1px solid ${ADM.border}`,
                        }}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {q.dados.map((g) => (
                    <tr key={g.chave} style={{ borderTop: `1px solid ${ADM.border}` }}>
                      <td
                        className="truncate px-4 py-2 text-[12.5px]"
                        style={{ color: ADM.text }}
                        title={q.rotulo(g.chave)}
                      >
                        {q.rotulo(g.chave)}
                      </td>
                      <td
                        className="py-2 pl-0 pr-3 text-right text-[12.5px] tabular-nums"
                        style={{ color: ADM.textMuted }}
                      >
                        {numero(g.turmas)}
                      </td>
                      <td
                        className="py-2 pl-0 pr-3 text-right text-[12.5px] tabular-nums"
                        style={{ color: ADM.textMuted }}
                      >
                        {numero(g.adesoes)}
                      </td>
                      <td
                        className="py-2 pl-0 pr-3 text-right text-[12.5px] font-semibold tabular-nums"
                        style={{ color: ADM.text }}
                      >
                        {numero(g.convites)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Painel>
        ))}
      </div>

      {/* ── turmas e alunos ── */}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold" style={{ color: ADM.text }}>
          Turmas e alunos
        </h2>
        <span className="text-[12px]" style={{ color: ADM.textMuted }}>
          Clique no representante para ver a lista de alunos dele
        </span>
      </div>
      <Painel padding={false}>
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          style={{ borderBottom: `1px solid ${ADM.border}` }}
        >
          <span className="text-[13px] font-semibold" style={{ color: ADM.text }}>
            {numero(resumo.turmas)} {resumo.turmas === 1 ? "turma" : "turmas"} ·{" "}
            {numero(resumo.adesoes)} {resumo.adesoes === 1 ? "aluno" : "alunos"}
          </span>
          <span className="text-[12px]" style={{ color: ADM.textMuted }}>
            {selecao.size
              ? `${selecao.size} selecionada${selecao.size === 1 ? "" : "s"} para o lote`
              : "Sem seleção — o lote usa todas as turmas do recorte"}
          </span>
        </div>

        {linhas.length === 0 ? (
          <Vazio
            titulo="Nenhuma turma neste recorte"
            detalhe="Afrouxe os filtros de período ou limpe a busca."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr>
                  <th className="w-10 px-3 py-2.5" style={{ borderBottom: `1px solid ${ADM.border}` }}>
                    <input
                      type="checkbox"
                      aria-label="Selecionar todas"
                      checked={selecao.size > 0 && selecao.size === linhas.length}
                      onChange={(e) =>
                        setSelecao(
                          e.target.checked ? new Set(linhas.map((l) => l.rep.id)) : new Set(),
                        )
                      }
                    />
                  </th>
                  {[
                    "Representante",
                    "Turma",
                    "Local",
                    "Cadastro",
                    "Convites",
                    "Adesões",
                    "Status",
                    "",
                  ].map((c, i) => (
                    <th
                      key={i}
                      className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase"
                      style={{
                        letterSpacing: "0.08em",
                        color: ADM.textMuted,
                        borderBottom: `1px solid ${ADM.border}`,
                      }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => {
                  const abertaAqui = aberta === l.rep.id;
                  return (
                    <Fragment key={l.rep.id}>
                      <tr style={{ borderBottom: `1px solid ${ADM.border}` }}>
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            aria-label={`Selecionar ${l.rep.name}`}
                            checked={selecao.has(l.rep.id)}
                            onChange={(e) =>
                              setSelecao((s) => {
                                const novo = new Set(s);
                                if (e.target.checked) novo.add(l.rep.id);
                                else novo.delete(l.rep.id);
                                return novo;
                              })
                            }
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => setAberta(abertaAqui ? null : l.rep.id)}
                            className="flex items-start gap-1.5 text-left"
                          >
                            {abertaAqui ? (
                              <ChevronDown size={14} className="mt-[3px] shrink-0" />
                            ) : (
                              <ChevronRight size={14} className="mt-[3px] shrink-0" />
                            )}
                            <span>
                              <span
                                className="block text-[13px] font-medium"
                                style={{ color: ADM.text }}
                              >
                                {l.rep.name}
                              </span>
                              <span className="block text-[12px]" style={{ color: ADM.textMuted }}>
                                {l.rep.email}
                                {l.telefone ? ` · ${maskPhone(l.telefone)}` : ""}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="block text-[13px]" style={{ color: ADM.text }}>
                            {l.rep.course_name}
                          </span>
                          <span className="block text-[12px]" style={{ color: ADM.textMuted }}>
                            {l.rep.institution_name} · {l.rep.graduation_year}
                          </span>
                        </td>
                        <td
                          className="whitespace-nowrap px-3 py-2.5 text-[12.5px]"
                          style={{ color: ADM.textMuted }}
                        >
                          {[l.rep.city, l.rep.state].filter(Boolean).join("/") || "—"}
                        </td>
                        <td
                          className="whitespace-nowrap px-3 py-2.5 text-[12.5px]"
                          style={{ color: ADM.textMuted }}
                        >
                          {dataAdmin(l.rep.created_at)}
                        </td>
                        <td className="px-3 py-2.5 text-[13px] font-semibold">
                          <span style={{ color: l.naMeta ? ADM.success : ADM.text }}>
                            {numero(l.convites)}
                          </span>
                          <span style={{ color: ADM.textMuted }}> / {META_CONVITES}</span>
                        </td>
                        <td className="px-3 py-2.5 text-[13px]" style={{ color: ADM.text }}>
                          {numero(l.adesoes)}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={l.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => pdfDaTurma(l)}
                            disabled={exportando !== null}
                            title="Baixar o PDF desta turma"
                            className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-40"
                            style={{ border: `1px solid ${ADM.border}`, color: ADM.text }}
                          >
                            {exportando === l.rep.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <FileDown size={14} strokeWidth={1.8} />
                            )}
                          </button>
                          <Link
                            href={`/admin/dashboard/${l.rep.id}`}
                            title="Abrir a turma"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                            style={{ border: `1px solid ${ADM.border}`, color: ADM.text }}
                          >
                            <Eye size={14} strokeWidth={1.8} />
                          </Link>
                        </td>
                      </tr>

                      {abertaAqui && (
                        <tr style={{ background: ADM.bg }}>
                          <td colSpan={9} className="px-4 py-4">
                            {l.alunos.length === 0 ? (
                              <p className="text-[12.5px]" style={{ color: ADM.textMuted }}>
                                Nenhuma adesão neste recorte.
                              </p>
                            ) : (
                              <table className="w-full">
                                <thead>
                                  <tr>
                                    {["#", "Aluno", "E-mail", "WhatsApp", "Convites", "Adesão em"].map(
                                      (c) => (
                                        <th
                                          key={c}
                                          className="px-2 py-1.5 text-left text-[10.5px] font-semibold uppercase"
                                          style={{ letterSpacing: "0.07em", color: ADM.textMuted }}
                                        >
                                          {c}
                                        </th>
                                      ),
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {l.alunos.map((a, i) => (
                                    <tr key={a.id} style={{ borderTop: `1px solid ${ADM.border}` }}>
                                      <td
                                        className="px-2 py-1.5 text-[12.5px]"
                                        style={{ color: ADM.textMuted }}
                                      >
                                        {i + 1}
                                      </td>
                                      <td
                                        className="px-2 py-1.5 text-[12.5px] font-medium"
                                        style={{ color: ADM.text }}
                                      >
                                        {a.full_name}
                                      </td>
                                      <td
                                        className="px-2 py-1.5 text-[12.5px]"
                                        style={{ color: ADM.textMuted }}
                                      >
                                        {a.email}
                                      </td>
                                      <td
                                        className="px-2 py-1.5 text-[12.5px]"
                                        style={{ color: ADM.textMuted }}
                                      >
                                        {a.phone ? maskPhone(a.phone) : "—"}
                                      </td>
                                      <td
                                        className="px-2 py-1.5 text-[12.5px] font-semibold"
                                        style={{ color: ADM.text }}
                                      >
                                        {a.qtd_convites || 0}
                                      </td>
                                      <td
                                        className="px-2 py-1.5 text-[12.5px]"
                                        style={{ color: ADM.textMuted }}
                                      >
                                        {dataAdmin(a.created_at)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Painel>

      <p className="mt-3 flex items-center gap-1.5 text-[12px]" style={{ color: ADM.textMuted }}>
        <Check size={13} strokeWidth={1.8} />
        O Excel, o PDF consolidado e o lote saem exatamente com o recorte acima. No lote o navegador
        pode pedir permissão para baixar vários arquivos de uma vez.
      </p>
    </div>
  );
}
