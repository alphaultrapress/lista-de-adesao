"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  Eye,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import WhatsAppModal from "@/components/admin/WhatsAppModal";
import { useLoadingGate } from "@/components/ui/LoadingScreen";
import { signOutAndClearSession, supabase, META_CONVITES } from "@/lib/supabase";
import { formatPhone } from "@/lib/format";
import { ADM, RADIUS } from "@/lib/admin/tokens";
import { dataAdmin, dataHoraAdmin, SEM_DATA, tempoRelativo } from "@/lib/admin/format";
import {
  carregarPainel,
  montarLinhas,
  STATUS_LABEL,
  type PainelDados,
  type RepLinha,
  type StatusRep,
} from "@/lib/admin/data";
import { ErroBloco, Painel, StatusBadge, Vazio } from "@/components/admin/Primitivos";

const PERIODOS = [
  { valor: "", label: "Qualquer data" },
  { valor: "hoje", label: "Hoje" },
  { valor: "7d", label: "Últimos 7 dias" },
  { valor: "30d", label: "Últimos 30 dias" },
] as const;

const POR_PAGINA = [20, 50, 100] as const;
const DIA = 86_400_000;

type Ordem = { campo: "created_at" | "name" | "convites" | "adesoes"; desc: boolean };

/* Os filtros moram na URL (useSearchParams), e no App Router isso obriga o
   componente a ficar dentro de um <Suspense> — sem ele o `next build` para de
   pre-renderizar a rota e o deploy quebra. O wrapper default abaixo cumpre
   esse papel. */
function RepresentantesConteudo() {
  const router = useRouter();
  const params = useSearchParams();

  const [dados, setDados] = useState<PainelDados | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | undefined>();
  const [removendo, setRemovendo] = useState<string | undefined>();
  const [aRemover, setARemover] = useState<RepLinha | null>(null);
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState<RepLinha | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  /* ── filtros vivem na URL, então voltar da página de detalhes os preserva ── */
  const q = params.get("q") ?? "";
  const curso = params.get("curso") ?? "";
  const instituicao = params.get("instituicao") ?? "";
  const uf = params.get("uf") ?? "";
  const status = params.get("status") ?? "";
  const periodo = params.get("periodo") ?? "";
  const minAdesoes = params.get("min") ?? "";
  const porPagina = Number(params.get("tam") ?? 20);
  const pagina = Number(params.get("p") ?? 1);
  const ordem: Ordem = {
    campo: (params.get("ord") as Ordem["campo"]) || "created_at",
    desc: params.get("dir") !== "asc",
  };

  const [busca, setBusca] = useState(q);
  const primeiroRender = useRef(true);

  const setParam = useCallback(
    (mudancas: Record<string, string | number | null>) => {
      const p = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(mudancas)) {
        if (v === null || v === "" ) p.delete(k);
        else p.set(k, String(v));
      }
      // Qualquer mudança de filtro volta para a primeira página.
      if (!("p" in mudancas)) p.delete("p");
      router.replace(`/admin/representantes?${p.toString()}`, { scroll: false });
    },
    [params, router],
  );

  // Debounce da busca: não reescreve a URL a cada tecla.
  useEffect(() => {
    if (primeiroRender.current) {
      primeiroRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (busca !== q) setParam({ q: busca || null });
    }, 320);
    return () => clearTimeout(t);
  }, [busca, q, setParam]);

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

  const linhas = dados?.linhas ?? [];

  const opcoes = useMemo(() => {
    const cursos = Array.from(new Set(linhas.map((r) => r.course_name))).sort();
    const inst = Array.from(new Set(linhas.map((r) => r.institution_name))).sort();
    const ufs = Array.from(
      new Set(linhas.map((r) => r.state).filter(Boolean) as string[]),
    ).sort();
    return { cursos, inst, ufs };
  }, [linhas]);

  const filtradas = useMemo(() => {
    const termo = q.trim().toLowerCase();
    const agora = Date.now();
    const limite =
      periodo === "hoje" ? DIA : periodo === "7d" ? 7 * DIA : periodo === "30d" ? 30 * DIA : null;
    const min = minAdesoes ? Number(minAdesoes) : null;

    const lista = linhas.filter((r) => {
      if (termo) {
        const alvo = `${r.name} ${r.email} ${r.consultant_phone ?? ""}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      if (curso && r.course_name !== curso) return false;
      if (instituicao && r.institution_name !== instituicao) return false;
      if (uf && r.state !== uf) return false;
      if (status) {
        // "Meta atingida" também traz as turmas já atendidas: elas bateram a
        // meta, só avançaram um passo depois. É o mesmo recorte que o
        // indicador do painel conta.
        const bate =
          status === "meta_atingida"
            ? r.convites >= META_CONVITES
            : r.status === status;
        if (!bate) return false;
      }
      if (min !== null && r.adesoes < min) return false;
      if (limite !== null) {
        const t = new Date(r.created_at).getTime();
        if (Number.isNaN(t) || agora - t > limite) return false;
      }
      return true;
    });

    const dir = ordem.desc ? -1 : 1;
    return lista.sort((a, b) => {
      if (ordem.campo === "name") return a.name.localeCompare(b.name) * dir;
      if (ordem.campo === "convites") return (a.convites - b.convites) * dir;
      if (ordem.campo === "adesoes") return (a.adesoes - b.adesoes) * dir;
      return (
        (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
      );
    });
  }, [linhas, q, curso, instituicao, uf, status, periodo, minAdesoes, ordem]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

  const chips = [
    q && { k: "q", label: `Busca: ${q}` },
    curso && { k: "curso", label: `Curso: ${curso}` },
    instituicao && { k: "instituicao", label: `Instituição: ${instituicao}` },
    uf && { k: "uf", label: `UF: ${uf}` },
    status && { k: "status", label: `Status: ${STATUS_LABEL[status as StatusRep] ?? status}` },
    periodo && {
      k: "periodo",
      label: `Período: ${PERIODOS.find((p) => p.valor === periodo)?.label ?? periodo}`,
    },
    minAdesoes && { k: "min", label: `Adesões ≥ ${minAdesoes}` },
  ].filter(Boolean) as { k: string; label: string }[];

  /* ─────────────────────────────── ações ─────────────────────────────── */

  async function confirmarRemocao() {
    const alvo = aRemover;
    if (!alvo || !dados) return;
    setRemovendo(alvo.id);
    setErro(undefined);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        router.replace("/admin/login");
        return;
      }
      const res = await fetch(`/api/representatives/${alvo.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        throw new Error(body.error || "Não foi possível remover o representante.");
      }
      // Recalcula as linhas a partir das listas já filtradas.
      const representantes = dados.representantes.filter((r) => r.id !== alvo.id);
      const alunos = dados.alunos.filter((a) => a.representative_id !== alvo.id);
      setDados({ representantes, alunos, linhas: montarLinhas(representantes, alunos) });
      setARemover(null);
    } catch (err: any) {
      setErro(err?.message || "Não foi possível remover o representante.");
      setARemover(null);
    } finally {
      setRemovendo(undefined);
    }
  }

  function copiarLink(r: RepLinha) {
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    navigator.clipboard?.writeText(`${base}/adesao/${r.slug}`).then(
      () => {
        setCopiado(r.id);
        setTimeout(() => setCopiado(null), 1800);
      },
      () => setErro("Não foi possível copiar o link."),
    );
  }

  function exportarCsv() {
    const cab = [
      "Representante", "E-mail", "Curso", "Instituição", "UF", "Cidade",
      "Ano/Período", "Data de cadastro", "Convites", "Adesões", "Status",
    ];
    const linhasCsv = filtradas.map((r) =>
      [
        r.name, r.email, r.course_name, r.institution_name, r.state ?? "",
        r.city ?? "", r.graduation_year, dataAdmin(r.created_at),
        r.convites, r.adesoes, STATUS_LABEL[r.status],
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const csv = "﻿" + [cab.join(";"), ...linhasCsv].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `representantes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function ordenarPor(campo: Ordem["campo"]) {
    const mesmo = ordem.campo === campo;
    setParam({ ord: campo, dir: mesmo && ordem.desc ? "asc" : "desc" });
  }

  if (carregandoTela) return tela;

  const Cabecalho = ({
    campo,
    children,
    className,
  }: {
    campo?: Ordem["campo"];
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={`whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase ${className ?? ""}`}
      style={{ letterSpacing: "0.08em", color: ADM.textMuted, borderBottom: `1px solid ${ADM.border}` }}
    >
      {campo ? (
        <button
          type="button"
          onClick={() => ordenarPor(campo)}
          className="inline-flex items-center gap-1"
          style={{ color: ordem.campo === campo ? ADM.text : "inherit" }}
        >
          {children}
          {ordem.campo === campo &&
            (ordem.desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
        </button>
      ) : (
        children
      )}
    </th>
  );

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="font-semibold"
            style={{ fontSize: 22, letterSpacing: "-0.02em", color: ADM.text }}
          >
            Representantes
          </h1>
          <p className="mt-1.5 text-[13.5px]" style={{ color: ADM.textMuted }}>
            {filtradas.length === linhas.length
              ? `${linhas.length} registros no total.`
              : `${filtradas.length} de ${linhas.length} registros.`}
          </p>
        </div>

        {/* Só o que funciona: a exportação respeita os filtros ativos. */}
        <button
          type="button"
          onClick={exportarCsv}
          className="inline-flex items-center gap-2 px-3.5 text-[13px] font-medium"
          style={{
            height: 38,
            borderRadius: RADIUS,
            border: `1px solid ${ADM.border}`,
            background: ADM.surface,
            color: ADM.text,
          }}
        >
          <Download size={15} strokeWidth={1.8} />
          Exportar {filtradas.length !== linhas.length ? "filtrados" : "tudo"}
        </button>
      </header>

      {erro && (
        <div className="mb-5">
          <ErroBloco mensagem={erro} />
        </div>
      )}

      {/* barra de filtros */}
      <Painel className="mb-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, e-mail ou telefone"
            className="w-full px-3 text-[13px] outline-none sm:col-span-2"
            style={{
              height: 38,
              borderRadius: RADIUS,
              border: `1px solid ${ADM.border}`,
              background: ADM.bg,
              color: ADM.text,
            }}
          />
          {[
            { v: curso, k: "curso", vazio: "Curso", ops: opcoes.cursos },
            { v: instituicao, k: "instituicao", vazio: "Instituição", ops: opcoes.inst },
            { v: uf, k: "uf", vazio: "Estado", ops: opcoes.ufs },
          ].map((s) => (
            <select
              key={s.k}
              value={s.v}
              onChange={(e) => setParam({ [s.k]: e.target.value || null })}
              className="w-full px-3 text-[13px] outline-none"
              style={{
                height: 38,
                borderRadius: RADIUS,
                border: `1px solid ${ADM.border}`,
                background: ADM.bg,
                color: s.v ? ADM.text : ADM.textMuted,
              }}
            >
              <option value="">{s.vazio}</option>
              {s.ops.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ))}
          <select
            value={status}
            onChange={(e) => setParam({ status: e.target.value || null })}
            className="w-full px-3 text-[13px] outline-none"
            style={{
              height: 38,
              borderRadius: RADIUS,
              border: `1px solid ${ADM.border}`,
              background: ADM.bg,
              color: status ? ADM.text : ADM.textMuted,
            }}
          >
            <option value="">Status</option>
            {(["novo", "em_andamento", "pendente", "meta_atingida", "atendida"] as StatusRep[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <select
            value={periodo}
            onChange={(e) => setParam({ periodo: e.target.value || null })}
            className="w-full px-3 text-[13px] outline-none"
            style={{
              height: 38,
              borderRadius: RADIUS,
              border: `1px solid ${ADM.border}`,
              background: ADM.bg,
              color: periodo ? ADM.text : ADM.textMuted,
            }}
          >
            {PERIODOS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button
                key={c.k}
                type="button"
                onClick={() => {
                  if (c.k === "q") setBusca("");
                  setParam({ [c.k]: null });
                }}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px]"
                style={{ background: ADM.bg, color: ADM.textMuted, border: `1px solid ${ADM.border}` }}
              >
                {c.label}
                <X size={11} strokeWidth={2.2} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setBusca("");
                router.replace("/admin/representantes", { scroll: false });
              }}
              className="text-[12px] font-medium underline-offset-2 hover:underline"
              style={{ color: ADM.text }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </Painel>

      {/* tabela */}
      <Painel padding={false}>
        {visiveis.length === 0 ? (
          <Vazio
            titulo="Nenhum representante encontrado"
            detalhe={
              chips.length
                ? "Tente remover algum filtro para ampliar o resultado."
                : "Quando uma turma se cadastrar, ela aparece aqui."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Cabecalho campo="name">Representante</Cabecalho>
                  <Cabecalho>Turma</Cabecalho>
                  <Cabecalho>Local</Cabecalho>
                  <Cabecalho campo="created_at">Cadastro</Cabecalho>
                  <Cabecalho campo="convites">Convites</Cabecalho>
                  <Cabecalho campo="adesoes">Adesões</Cabecalho>
                  <Cabecalho>Status</Cabecalho>
                  <Cabecalho className="text-right">Ações</Cabecalho>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((r) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${ADM.border}` }}>
                    {/* Nome e e-mail juntos. A largura mínima impede o nome de
                        quebrar em quatro linhas, como acontecia antes. */}
                    <td className="px-3 py-3" style={{ minWidth: 230 }}>
                      <Link
                        href={`/admin/dashboard/${r.id}`}
                        className="block truncate text-[13px] font-medium underline-offset-2 hover:underline"
                        style={{ color: ADM.text, maxWidth: 260 }}
                        title={r.name}
                      >
                        {r.name}
                      </Link>
                      <span
                        className="block truncate text-[12px]"
                        style={{ color: ADM.textMuted, maxWidth: 260 }}
                        title={`${r.email} · ${formatPhone(r.consultant_phone)}`}
                      >
                        {r.email}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-[12.5px]" style={{ minWidth: 210 }}>
                      <span
                        className="block truncate"
                        style={{ color: ADM.text, maxWidth: 240 }}
                        title={r.course_name}
                      >
                        {r.course_name}
                      </span>
                      <span
                        className="block truncate"
                        style={{ color: ADM.textMuted, maxWidth: 240 }}
                        title={`${r.institution_name} · ${r.graduation_year}`}
                      >
                        {r.institution_name} · {r.graduation_year}
                      </span>
                    </td>

                    <td
                      className="whitespace-nowrap px-3 py-3 text-[12.5px]"
                      style={{ color: ADM.textMuted }}
                    >
                      {r.city ? `${r.city}/${r.state ?? "-"}` : (r.state ?? "-")}
                    </td>

                    {/* Data real de cadastro: dia na célula, data e hora no hover. */}
                    <td className="whitespace-nowrap px-3 py-3 text-[12.5px]">
                      <span
                        className="block"
                        style={{
                          color: dataAdmin(r.created_at) === SEM_DATA ? ADM.warning : ADM.text,
                        }}
                        title={dataHoraAdmin(r.created_at)}
                      >
                        {dataAdmin(r.created_at)}
                      </span>
                      <span
                        className="block text-[12px]"
                        style={{ color: ADM.textMuted }}
                        title={`Última atividade: ${dataHoraAdmin(r.ultimaAtividade)}`}
                      >
                        ativo {tempoRelativo(r.ultimaAtividade)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-[12.5px]">
                      <span
                        className="font-semibold"
                        style={{ color: r.convites >= META_CONVITES ? ADM.success : ADM.text }}
                      >
                        {r.convites}
                      </span>
                      <span style={{ color: ADM.textMuted }}> / {META_CONVITES}</span>
                    </td>

                    <td className="px-3 py-3 text-[12.5px]" style={{ color: ADM.text }}>
                      {r.adesoes}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          aria-label={`Ações de ${r.name}`}
                          onClick={() => setMenuAberto(menuAberto === r.id ? null : r.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                          style={{ border: `1px solid ${ADM.border}`, color: ADM.textMuted }}
                        >
                          <MoreHorizontal size={15} strokeWidth={1.8} />
                        </button>

                        {menuAberto === r.id && (
                          <>
                            <button
                              type="button"
                              aria-label="Fechar"
                              onClick={() => setMenuAberto(null)}
                              className="fixed inset-0 z-40 cursor-default"
                            />
                            <div
                              className="absolute right-0 z-50 mt-1 w-[210px] overflow-hidden text-left"
                              style={{
                                background: ADM.surface,
                                border: `1px solid ${ADM.border}`,
                                borderRadius: RADIUS,
                                boxShadow: "0 16px 40px rgba(17,24,22,0.14)",
                              }}
                            >
                              <Link
                                href={`/admin/dashboard/${r.id}`}
                                className="flex items-center gap-2.5 px-3 py-2.5 text-[13px]"
                                style={{ color: ADM.text }}
                              >
                                <Eye size={14} strokeWidth={1.7} />
                                Visualizar perfil
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  copiarLink(r);
                                  setMenuAberto(null);
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px]"
                                style={{ color: ADM.text }}
                              >
                                <Copy size={14} strokeWidth={1.7} />
                                {copiado === r.id ? "Link copiado" : "Copiar link da turma"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setWhatsapp(r);
                                  setMenuAberto(null);
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px]"
                                style={{ color: ADM.text }}
                              >
                                <MessageCircle size={14} strokeWidth={1.7} />
                                Enviar WhatsApp
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setARemover(r);
                                  setMenuAberto(null);
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px]"
                                style={{ color: ADM.danger, borderTop: `1px solid ${ADM.border}` }}
                              >
                                <Trash2 size={14} strokeWidth={1.7} />
                                Excluir
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* paginação */}
        {filtradas.length > 0 && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            style={{ borderTop: `1px solid ${ADM.border}` }}
          >
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: ADM.textMuted }}>
              <span>Por página</span>
              <select
                value={porPagina}
                onChange={(e) => setParam({ tam: e.target.value })}
                className="px-2 py-1 text-[12.5px] outline-none"
                style={{ borderRadius: 6, border: `1px solid ${ADM.border}`, background: ADM.surface }}
              >
                {POR_PAGINA.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: ADM.textMuted }}>
              <span>
                Página {paginaAtual} de {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaAtual <= 1}
                onClick={() => setParam({ p: paginaAtual - 1 })}
                className="px-2.5 py-1 disabled:opacity-40"
                style={{ borderRadius: 6, border: `1px solid ${ADM.border}`, background: ADM.surface }}
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={paginaAtual >= totalPaginas}
                onClick={() => setParam({ p: paginaAtual + 1 })}
                className="px-2.5 py-1 disabled:opacity-40"
                style={{ borderRadius: 6, border: `1px solid ${ADM.border}`, background: ADM.surface }}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </Painel>

      {/* Mesmo modal que o painel antigo usava, com a API dele (name/onClose). */}
      {whatsapp && (
        <WhatsAppModal linha={whatsapp} onClose={() => setWhatsapp(null)} />
      )}

      <ConfirmDeleteModal
        open={Boolean(aRemover)}
        name={aRemover?.name}
        loading={Boolean(removendo)}
        onClose={() => setARemover(null)}
        onConfirm={confirmarRemocao}
      />
    </div>
  );
}

export default function RepresentantesPage() {
  // A pagina inteira e client-side e fica atras do login do admin, entao o
  // fallback so aparece no instante entre o HTML e a hidratacao.
  return (
    <Suspense fallback={null}>
      <RepresentantesConteudo />
    </Suspense>
  );
}
