"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  FileDown,
  Send,
  Undo2,
} from "lucide-react";
import {
  signOutAndClearSession,
  supabase,
  Representative,
  Student,
  META_CONVITES,
} from "@/lib/supabase";
import { formatPhone } from "@/lib/format";
import { downloadLeadPdf } from "@/lib/leadPdf";
import LeadSuccessModal from "@/components/admin/LeadSuccessModal";
import { useLoadingGate } from "@/components/ui/LoadingScreen";
import { ADM, RADIUS } from "@/lib/admin/tokens";
import { dataAdmin, dataHoraAdmin, tempoRelativo } from "@/lib/admin/format";
import { ErroBloco, Painel, StatusBadge, TituloPainel, Vazio } from "@/components/admin/Primitivos";
import type { StatusRep } from "@/lib/admin/data";

/**
 * Botão do padrão administrativo.
 *
 * A cor não é enfeite: identifica o que a ação faz. Verde confirma, âmbar
 * desfaz, preto é o encaminhamento comercial, neutro é utilitário. O resto da
 * tela segue sem cor, para esses quatro se destacarem.
 */
type VarianteBotao = "neutro" | "escuro" | "sucesso" | "atencao";

const PALETA_BOTAO: Record<
  VarianteBotao,
  { fundo: string; borda: string; texto: string; hover: string }
> = {
  neutro: { fundo: ADM.surface, borda: ADM.border, texto: ADM.text, hover: ADM.bg },
  escuro: { fundo: ADM.ink, borda: ADM.ink, texto: "#FFFFFF", hover: "#2A2C28" },
  sucesso: { fundo: ADM.success, borda: ADM.success, texto: "#FFFFFF", hover: "#1C6A40" },
  atencao: {
    fundo: ADM.surface,
    borda: "rgba(162,103,25,0.45)",
    texto: ADM.warning,
    hover: "rgba(162,103,25,0.07)",
  },
};

function Botao({
  children,
  onClick,
  variante = "neutro",
  disabled,
  icone,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variante?: VarianteBotao;
  disabled?: boolean;
  icone?: React.ReactNode;
}) {
  const p = PALETA_BOTAO[variante];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="inline-flex items-center gap-2 whitespace-nowrap px-3.5 text-[13px] font-medium disabled:opacity-50"
      style={{
        height: 38,
        borderRadius: RADIUS,
        border: `1px solid ${p.borda}`,
        background: p.fundo,
        color: p.texto,
        transition: "background 180ms ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = p.hover;
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = p.fundo;
      }}
    >
      {icone}
      {children}
    </motion.button>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p
        className="text-[10.5px] uppercase"
        style={{ letterSpacing: "0.12em", color: ADM.textMuted }}
      >
        {rotulo}
      </p>
      <p className="mt-1 text-[13.5px]" style={{ color: ADM.text }}>
        {valor || "Não informado"}
      </p>
    </div>
  );
}

export default function AdminRepresentativePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const representativeId = params?.id;

  const [representative, setRepresentative] = useState<Representative | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [marcandoAtendido, setMarcandoAtendido] = useState(false);
  const [gerandoLead, setGerandoLead] = useState(false);
  const [leadError, setLeadError] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [leadId, setLeadId] = useState<number | undefined>();
  const [copiado, setCopiado] = useState(false);

  const totalConvites = useMemo(
    () => students.reduce((sum, s) => sum + (s.qtd_convites || 0), 0),
    [students],
  );
  const metaAtingida = totalConvites >= META_CONVITES;
  const atendida = Boolean(representative?.contacted_at);
  const leadCriado = Boolean(representative?.lead_created_at);

  const status: StatusRep = atendida
    ? "atendida"
    : metaAtingida
      ? "meta_atingida"
      : students.length > 0
        ? "em_andamento"
        : "pendente";

  const linkTurma = representative
    ? `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "")}/adesao/${representative.slug}`
    : "";

  async function gerarLead() {
    if (!representative) return;
    setGerandoLead(true);
    setLeadError(undefined);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;

      const res = await fetch(`/api/representatives/${representative.id}/lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Falha ao gerar lead.");

      setLeadId(data.leadId);
      setModalOpen(true);
      setRepresentative((current) =>
        current ? { ...current, lead_created_at: new Date().toISOString() } : current,
      );
    } catch (err: any) {
      setLeadError(err?.message || "Não foi possível gerar o lead.");
    } finally {
      setGerandoLead(false);
    }
  }

  function baixarLeadPdf() {
    if (!representative) return;
    // O representante também se cadastra na lista; pega o telefone dele
    // casando pelo e-mail (ou, em último caso, pelo nome).
    const repEmail = representative.email.trim().toLowerCase();
    const repNome = representative.name.trim().toLowerCase();
    const repStudent =
      students.find((s) => s.email.trim().toLowerCase() === repEmail) ||
      students.find((s) => s.full_name.trim().toLowerCase() === repNome);
    void downloadLeadPdf({
      curso: representative.course_name,
      instituicao: representative.institution_name,
      ano: representative.graduation_year,
      representanteNome: representative.name,
      representanteEmail: representative.email,
      representanteTelefone: repStudent?.phone,
      students: students.map((s) => ({
        full_name: s.full_name,
        email: s.email,
        phone: s.phone,
        qtd_convites: s.qtd_convites,
      })),
    });
  }

  async function toggleAtendido() {
    if (!representative) return;
    setMarcandoAtendido(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;

      const res = await fetch(`/api/representatives/${representative.id}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contacted: !atendida }),
      });

      if (res.ok) {
        const data = await res.json();
        setRepresentative((current) =>
          current ? { ...current, contacted_at: data.contacted_at } : current,
        );
      }
    } finally {
      setMarcandoAtendido(false);
    }
  }

  function copiarLink() {
    navigator.clipboard?.writeText(linkTurma).then(
      () => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1800);
      },
      () => setError("Não foi possível copiar o link."),
    );
  }

  useEffect(() => {
    if (!representativeId) return;

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

      const [representativeResult, studentsResult] = await Promise.all([
        supabase.from("representatives").select("*").eq("id", representativeId).maybeSingle(),
        supabase
          .from("students")
          .select("*")
          .eq("representative_id", representativeId)
          .order("created_at", { ascending: false }),
      ]);

      if (representativeResult.error || studentsResult.error) {
        setError(
          representativeResult.error?.message ||
            studentsResult.error?.message ||
            "Não foi possível carregar os dados.",
        );
      } else {
        setRepresentative((representativeResult.data as Representative | null) || null);
        setStudents((studentsResult.data as Student[]) || []);
      }

      setLoading(false);
    })();
  }, [representativeId, router]);

  const { mostrando: carregandoTela, tela } = useLoadingGate(loading);
  if (carregandoTela) return tela;

  if (!representative) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <Link
          href="/admin/representantes"
          className="mb-5 inline-flex items-center gap-1.5 text-[13px]"
          style={{ color: ADM.textMuted }}
        >
          <ArrowLeft size={14} strokeWidth={1.8} />
          Representantes
        </Link>
        <Painel>
          <Vazio
            titulo="Representante não encontrado"
            detalhe="O registro pode ter sido removido. Volte à lista para conferir."
          />
        </Painel>
      </div>
    );
  }

  const faltam = Math.max(0, META_CONVITES - totalConvites);

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link
        href="/admin/representantes"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] transition-colors hover:text-[#171816]"
        style={{ color: ADM.textMuted }}
      >
        <ArrowLeft size={14} strokeWidth={1.8} />
        Representantes
      </Link>

      {/* cabeçalho */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className="font-semibold"
              style={{ fontSize: 22, letterSpacing: "-0.02em", color: ADM.text }}
            >
              {representative.name}
            </h1>
            {/* O badge já diz "Atendida" quando há contacted_at. */}
            <StatusBadge status={status} />
          </div>
          <p className="mt-1.5 text-[13.5px]" style={{ color: ADM.textMuted }}>
            {representative.course_name} · {representative.institution_name} ·{" "}
            {representative.graduation_year}
          </p>
        </div>

        {/* ações */}
        <div className="flex flex-wrap items-center gap-2">
          <Botao onClick={copiarLink} icone={<Copy size={15} strokeWidth={1.8} />}>
            {copiado ? "Link copiado" : "Copiar link"}
          </Botao>
          <Botao
            onClick={baixarLeadPdf}
            disabled={students.length === 0}
            icone={<FileDown size={15} strokeWidth={1.8} />}
          >
            Baixar PDF
          </Botao>
          <Botao
            variante={atendida ? "atencao" : "sucesso"}
            onClick={toggleAtendido}
            disabled={marcandoAtendido}
            icone={
              atendida ? <Undo2 size={15} strokeWidth={1.8} /> : <Check size={15} strokeWidth={2} />
            }
          >
            {marcandoAtendido
              ? "Salvando…"
              : atendida
                ? "Desmarcar atendimento"
                : "Marcar como atendida"}
          </Botao>

          {/* O encaminhamento comercial só existe depois do atendimento. */}
          <AnimatePresence>
            {atendida && (
              <motion.div
                initial={{ opacity: 0, x: 8, width: 0 }}
                animate={{ opacity: 1, x: 0, width: "auto" }}
                exit={{ opacity: 0, x: 8, width: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                <Botao
                  variante="escuro"
                  onClick={gerarLead}
                  disabled={gerandoLead}
                  icone={<Send size={15} strokeWidth={1.8} />}
                >
                  {gerandoLead ? "Gerando…" : leadCriado ? "Gerar lead novamente" : "Gerar lead"}
                </Botao>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {error && (
        <div className="mb-5">
          <ErroBloco mensagem={error} />
        </div>
      )}
      {leadError && (
        <div className="mb-5">
          <ErroBloco mensagem={leadError} />
        </div>
      )}

      {/* indicadores da turma */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Convites",
            valor: `${totalConvites}`,
            apoio: `de ${META_CONVITES} da meta`,
            destaque: metaAtingida,
          },
          {
            label: "Alunos na lista",
            valor: String(students.length),
            apoio: students.length === 1 ? "1 adesão" : `${students.length} adesões`,
            destaque: false,
          },
          {
            label: "Cadastro",
            valor: dataAdmin(representative.created_at),
            apoio: tempoRelativo(representative.created_at),
            destaque: false,
          },
          {
            label: "Situação",
            // Mesmo vocabulário do resto do painel: a turma vai de "Faltam X"
            // para "Meta atingida" e daí para "Meta atendida".
            valor: !metaAtingida
              ? `Faltam ${faltam}`
              : atendida
                ? "Meta atendida"
                : "Meta atingida",
            apoio: !metaAtingida
              ? "convites para a meta"
              : atendida
                ? "Turma já contatada"
                : "Aguardando atendimento",
            destaque: metaAtingida,
          },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-between"
            style={{
              height: 118,
              background: ADM.surface,
              border: `1px solid ${ADM.border}`,
              borderRadius: RADIUS,
              padding: 16,
            }}
          >
            <p
              className="text-[11px] uppercase"
              style={{ letterSpacing: "0.1em", color: ADM.textMuted }}
            >
              {c.label}
            </p>
            <p
              className="font-semibold leading-none"
              style={{
                fontSize: 26,
                letterSpacing: "-0.03em",
                color: c.destaque ? ADM.success : ADM.text,
              }}
            >
              {c.valor}
            </p>
            <p className="truncate text-[12px]" style={{ color: ADM.textMuted }}>
              {c.apoio}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* dados da turma */}
        <Painel className="lg:col-span-1">
          <TituloPainel titulo="Dados da turma" descricao="Informações do cadastro." />
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <Campo rotulo="Representante" valor={representative.name} />
            <Campo rotulo="Curso" valor={representative.course_name} />
            <Campo rotulo="Instituição" valor={representative.institution_name} />
            <Campo rotulo="Ano/Período" valor={representative.graduation_year} />
            <Campo rotulo="Cidade" valor={representative.city ?? ""} />
            <Campo rotulo="Estado" valor={representative.state ?? ""} />
            <Campo rotulo="E-mail" valor={representative.email} />
            <Campo
              rotulo="Consultor"
              valor={representative.consultant_name ?? ""}
            />
          </div>

          <div className="mt-5">
            <p
              className="text-[10.5px] uppercase"
              style={{ letterSpacing: "0.12em", color: ADM.textMuted }}
            >
              Link público da turma
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <code
                className="min-w-0 flex-1 truncate px-2.5 py-2 text-[12px]"
                style={{
                  background: ADM.bg,
                  border: `1px solid ${ADM.border}`,
                  borderRadius: 8,
                  color: ADM.text,
                }}
                title={linkTurma}
              >
                {linkTurma}
              </code>
              <a
                href={`/adesao/${representative.slug}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir link da turma"
                className="flex h-9 w-9 shrink-0 items-center justify-center"
                style={{ border: `1px solid ${ADM.border}`, borderRadius: 8, color: ADM.textMuted }}
              >
                <ExternalLink size={15} strokeWidth={1.8} />
              </a>
            </div>
          </div>

          {/* carimbos reais do banco */}
          <div className="mt-5 space-y-2" style={{ borderTop: `1px solid ${ADM.border}`, paddingTop: 16 }}>
            {[
              { r: "Cadastro", v: representative.created_at },
              { r: "Meta notificada", v: representative.meta_notified_at },
              { r: "Atendimento", v: representative.contacted_at },
              { r: "Lead gerado", v: representative.lead_created_at },
            ].map((l) => (
              <div key={l.r} className="flex items-baseline justify-between gap-3">
                <span className="text-[12px]" style={{ color: ADM.textMuted }}>
                  {l.r}
                </span>
                <span className="text-[12.5px]" style={{ color: l.v ? ADM.text : ADM.textMuted }}>
                  {l.v ? dataHoraAdmin(l.v) : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </Painel>

        {/* alunos */}
        <Painel className="lg:col-span-2" padding={false}>
          <div className="p-5 pb-0">
            <TituloPainel
              titulo="Alunos na lista"
              descricao="Somente quem preencheu o formulário público aparece aqui."
              acao={
                <span
                  className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-medium"
                  style={{ background: ADM.bg, color: ADM.textMuted }}
                >
                  {students.length} {students.length === 1 ? "aluno" : "alunos"}
                </span>
              }
            />
          </div>

          {students.length === 0 ? (
            <Vazio
              titulo="Nenhum aluno ainda"
              detalhe="Compartilhe o link da turma para a lista começar a receber adesões."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Nome", "E-mail", "Celular", "Entrou", "Convites"].map((h, i) => (
                      <th
                        key={h}
                        className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase ${i === 4 ? "text-right" : "text-left"}`}
                        style={{
                          letterSpacing: "0.08em",
                          color: ADM.textMuted,
                          borderBottom: `1px solid ${ADM.border}`,
                          borderTop: `1px solid ${ADM.border}`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${ADM.border}` }}>
                      <td className="px-4 py-3 text-[13px]" style={{ color: ADM.text }}>
                        {s.full_name}
                      </td>
                      <td
                        className="max-w-[220px] truncate px-4 py-3 text-[12.5px]"
                        style={{ color: ADM.textMuted }}
                        title={s.email}
                      >
                        {s.email}
                      </td>
                      <td
                        className="whitespace-nowrap px-4 py-3 text-[12.5px]"
                        style={{ color: ADM.textMuted }}
                      >
                        {formatPhone(s.phone)}
                      </td>
                      <td
                        className="whitespace-nowrap px-4 py-3 text-[12.5px]"
                        style={{ color: ADM.textMuted }}
                        title={dataHoraAdmin(s.created_at)}
                      >
                        {dataAdmin(s.created_at)}
                      </td>
                      <td
                        className="whitespace-nowrap px-4 py-3 text-right text-[13px] font-semibold"
                        style={{ color: ADM.text }}
                      >
                        {s.qtd_convites}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Painel>
      </div>

      <LeadSuccessModal
        open={modalOpen}
        leadId={leadId}
        onClose={() => setModalOpen(false)}
        onDownloadPdf={baixarLeadPdf}
      />
    </div>
  );
}
