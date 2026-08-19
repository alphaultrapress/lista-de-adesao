"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronRight } from "lucide-react";
import { META_CONVITES, signOutAndClearSession, supabase } from "@/lib/supabase";
import { useLoadingGate } from "@/components/ui/LoadingScreen";
import { ADM, RADIUS } from "@/lib/admin/tokens";
import { dataHoraAdmin, tempoRelativo } from "@/lib/admin/format";
import {
  atividades,
  carregarPainel,
  graficoMetas,
  indicadores,
  pendencias,
  type BarraMeta,
  type PainelDados,
} from "@/lib/admin/data";
import {
  CardIndicador,
  ErroBloco,
  Painel,
  TituloPainel,
  Vazio,
} from "@/components/admin/Primitivos";

/** Quantas atividades a linha de baixo mostra. */
const ATIVIDADES_VISIVEIS = 5;

function DicaMeta({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as BarraMeta;
  return (
    <div
      className="px-3 py-2 text-[12px]"
      style={{
        background: ADM.surface,
        border: `1px solid ${ADM.border}`,
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(17,24,22,0.10)",
      }}
    >
      <p className="font-semibold" style={{ color: ADM.text }}>
        {d.nome}
      </p>
      <p style={{ color: ADM.textMuted }}>{d.curso}</p>
      <p className="mt-1" style={{ color: d.bateu ? ADM.success : ADM.text }}>
        {d.convites} convites · {d.adesoes} adesões
      </p>
      <p style={{ color: ADM.textMuted }}>
        {d.bateu ? "Meta atingida" : `Faltam ${META_CONVITES - d.convites}`}
      </p>
    </div>
  );
}

export default function VisaoGeralPage() {
  const router = useRouter();
  const [dados, setDados] = useState<PainelDados | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      // Guarda de admin: sessão + registro na tabela admins.
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

  const kpis = useMemo(() => (dados ? indicadores(dados) : []), [dados]);
  const barras = useMemo(() => (dados ? graficoMetas(dados) : []), [dados]);
  const eventos = useMemo(
    () => (dados ? atividades(dados, ATIVIDADES_VISIVEIS) : []),
    [dados],
  );
  const alertas = useMemo(() => (dados ? pendencias(dados, 6) : []), [dados]);

  const bateram = barras.filter((b) => b.bateu).length;
  // Com muitas turmas os nomes no eixo colidem; aí o tooltip assume.
  const mostrarNomes = barras.length <= 22;

  if (carregandoTela) return tela;

  return (
    <div className="mx-auto max-w-[1400px]">
      <header className="mb-6">
        <h1
          className="font-semibold"
          style={{ fontSize: 22, letterSpacing: "-0.02em", color: ADM.text }}
        >
          Visão geral
        </h1>
        <p className="mt-1.5 text-[13.5px]" style={{ color: ADM.textMuted }}>
          Acompanhe o desempenho das turmas e o que precisa de atenção.
        </p>
      </header>

      {erro && (
        <div className="mb-6">
          <ErroBloco mensagem={erro} />
        </div>
      )}

      {/* ── linha 1: os quatro números ── */}
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <CardIndicador
            key={k.chave}
            {...k}
            destaque={k.chave === "metas_atendidas"}
          />
        ))}
      </div>

      {/* ── linha 2: o gráfico da meta, largura toda ── */}
      <Painel className="mb-4">
        <TituloPainel
          titulo="Convites por turma"
          descricao={`Linha da meta em ${META_CONVITES} convites. Em verde, as turmas que passaram dela.`}
          acao={
            <span
              className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-medium"
              style={{ background: "rgba(35,122,75,0.10)", color: ADM.success }}
            >
              {bateram} de {barras.length} na meta
            </span>
          }
        />

        {barras.length === 0 ? (
          <Vazio
            titulo="Nenhuma turma cadastrada"
            detalhe="O gráfico aparece quando a primeira turma registrar convites."
          />
        ) : (
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barras}
                margin={{ top: 8, right: 8, left: -20, bottom: mostrarNomes ? 28 : 4 }}
                barCategoryGap="18%"
              >
                <CartesianGrid stroke={ADM.border} vertical={false} />
                <XAxis
                  dataKey="nome"
                  tick={mostrarNomes ? { fontSize: 10.5, fill: ADM.textMuted } : false}
                  angle={mostrarNomes ? -35 : 0}
                  textAnchor={mostrarNomes ? "end" : "middle"}
                  interval={0}
                  height={mostrarNomes ? 52 : 8}
                  stroke={ADM.border}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: ADM.textMuted }}
                  stroke={ADM.border}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<DicaMeta />} cursor={{ fill: "rgba(17,24,22,0.04)" }} />
                <ReferenceLine
                  y={META_CONVITES}
                  stroke={ADM.success}
                  strokeDasharray="4 4"
                  label={{
                    value: `Meta ${META_CONVITES}`,
                    position: "right",
                    fill: ADM.success,
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="convites" radius={[3, 3, 0, 0]} maxBarSize={44}>
                  {barras.map((b) => (
                    <Cell key={b.id} fill={b.bateu ? ADM.success : ADM.ink} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Painel>

      {/* ── linha 3: atividades recentes e pendências ── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Painel>
          <TituloPainel
            titulo="Atividades recentes"
            descricao={`Os ${ATIVIDADES_VISIVEIS} eventos mais novos.`}
            acao={
              <Link
                href="/admin/representantes"
                className="shrink-0 whitespace-nowrap text-[12.5px] font-medium underline-offset-2 hover:underline"
                style={{ color: ADM.text }}
              >
                Ver tudo
              </Link>
            }
          />
          {eventos.length === 0 ? (
            <Vazio titulo="Sem atividades registradas" />
          ) : (
            <ol>
              {eventos.map((e, i) => (
                <li key={e.id} className="relative flex gap-3.5 pb-4 last:pb-0">
                  {i < eventos.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[5px] top-4 h-full w-px"
                      style={{ background: ADM.border }}
                    />
                  )}
                  <span
                    aria-hidden
                    className="relative mt-[5px] h-[11px] w-[11px] shrink-0 rounded-full"
                    style={{ background: ADM.surface, border: `2px solid ${ADM.border}` }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium" style={{ color: ADM.text }}>
                      {e.acao}
                    </p>
                    <p
                      className="truncate text-[12.5px]"
                      style={{ color: ADM.textMuted }}
                      title={`${e.pessoa} · ${e.registro}`}
                    >
                      {e.pessoa} · {e.registro}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[12px]">
                      <span style={{ color: ADM.textMuted }} title={dataHoraAdmin(e.quando)}>
                        {tempoRelativo(e.quando)}
                      </span>
                      <Link
                        href={e.href}
                        className="font-medium underline-offset-2 hover:underline"
                        style={{ color: ADM.text }}
                      >
                        detalhes
                      </Link>
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Painel>

        <Painel>
          <TituloPainel
            titulo="Pendências"
            descricao="Turmas que precisam de uma ação da equipe."
          />
          {alertas.length === 0 ? (
            <Vazio
              titulo="Nada pendente"
              detalhe="Nenhuma turma na meta está sem atendimento."
            />
          ) : (
            <ul className="space-y-1.5">
              {alertas.map((p) => (
                <li key={p.id}>
                  <Link
                    href={p.href}
                    className="flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-[#F5F5F3]"
                    style={{ borderRadius: RADIUS - 2 }}
                  >
                    <span
                      aria-hidden
                      className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background: p.nivel === "atencao" ? ADM.warning : ADM.textMuted,
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px]" style={{ color: ADM.text }}>
                        {p.titulo}
                      </span>
                      <span
                        className="block truncate text-[12px]"
                        style={{ color: ADM.textMuted }}
                      >
                        {p.detalhe}
                      </span>
                    </span>
                    <ChevronRight
                      size={14}
                      strokeWidth={1.7}
                      color={ADM.textMuted}
                      className="mt-[3px] shrink-0"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>
    </div>
  );
}
