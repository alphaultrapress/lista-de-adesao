"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  supabase,
  Student,
  Representative,
  MAX_CONVITES_POR_PESSOA,
  META_CONVITES,
} from "@/lib/supabase";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { isValidPhoneBr, onlyDigits } from "@/lib/cpf";
import { buildQrPosterBlob, slugifyFile } from "@/lib/qrPoster";
import { buildWhatsAppShareUrl } from "@/lib/share";
import { absoluteUrl, PROMO_VIDEO_PATH } from "@/lib/site";
import DashboardShareReminder from "./DashboardShareReminder";
import Input from "../ui/Input";
import PhoneInput from "../forms/PhoneInput";
import AuthButton from "../auth/AuthButton";
import { AUTH } from "../auth/tokens";

type StudentRow = Pick<
  Student,
  "id" | "full_name" | "created_at" | "qtd_convites"
>;

interface Props {
  representative: Representative;
  adesaoUrl: string;
}

export default function TurmaDashboard({ representative, adesaoUrl }: Props) {
  const [list, setList] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [justJoined, setJustJoined] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const representativeId = representative.id;

  // Dispara a verificação de meta (cria lead/notifica ao atingir 30) — fire-and-forget.
  const notifyMeta = useCallback(() => {
    fetch("/api/notify-meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ representative_id: representativeId }),
    }).catch(() => {});
  }, [representativeId]);

  const load = useCallback(
    async (highlightNewest = false) => {
      const { data } = await supabase
        .from("students")
        .select("id, full_name, created_at, qtd_convites")
        .eq("representative_id", representativeId)
        .order("created_at", { ascending: true });
      const rows = (data as StudentRow[]) || [];
      if (highlightNewest && rows.length) {
        const newest = rows[rows.length - 1];
        setJustJoined(newest.id);
        setTimeout(() => setJustJoined(null), 3000);
      }
      setList(rows);
      setLoading(false);
    },
    [representativeId],
  );

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`turma-${representativeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
          filter: `representative_id=eq.${representativeId}`,
        },
        (payload) => load(payload.eventType === "INSERT"),
      )
      .subscribe();

    const onRefresh = () => load();
    window.addEventListener("adesoes:refresh", onRefresh);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("adesoes:refresh", onRefresh);
    };
  }, [representativeId, load]);

  const totalConvites = list.reduce((s, r) => s + (r.qtd_convites || 0), 0);
  const participantes = list.length;
  const faltam = Math.max(0, META_CONVITES - totalConvites);
  const metaAtingida = totalConvites >= META_CONVITES;

  return (
    <>
      <div className="relative space-y-5">
        <ResumoCards
          totalConvites={totalConvites}
          participantes={participantes}
          faltam={faltam}
          metaAtingida={metaAtingida}
        />

        <ProgressCard
          representativeId={representativeId}
          total={totalConvites}
          faltam={faltam}
          metaAtingida={metaAtingida}
        />

        <TurmaList
          list={list}
          loading={loading}
          curso={representative.course_name}
          justJoined={justJoined}
          onReload={load}
          onAdd={() => setShowAddModal(true)}
          onMutate={notifyMeta}
        />
      </div>

      {showAddModal && (
        <AddStudentModal
          representativeId={representativeId}
          url={adesaoUrl}
          nome={representative.name}
          curso={representative.course_name}
          instituicao={representative.institution_name}
          onClose={() => setShowAddModal(false)}
          onDone={async () => {
            setShowAddModal(false);
            await load();
            window.dispatchEvent(new CustomEvent("adesoes:refresh"));
            notifyMeta();
          }}
        />
      )}

      <DashboardShareReminder
        active={metaAtingida && !showAddModal}
        adesaoUrl={adesaoUrl}
        nome={representative.name}
        curso={representative.course_name}
        instituicao={representative.institution_name}
      />
    </>
  );
}

interface AchievementNotice {
  eyebrow: string;
  title: string;
  description: string;
  next: string;
}

const META_ACHIEVEMENT: AchievementNotice = {
  eyebrow: "Meta inicial concluída",
  title: "Parabéns! Sua turma chegou a 30 convites.",
  description:
    "A equipe Alpha já pode falar com você. Enquanto isso, a lista continua aberta: compartilhe o link com quem ainda não entrou. Cada nova adesão fortalece a negociação da turma.",
  next: "A lista segue aberta até o contato da equipe Alpha.",
};

const inviteNumberFormatter = new Intl.NumberFormat("pt-BR");

function formatInviteCount(value: number) {
  return inviteNumberFormatter.format(value);
}

/* ============================================================
   CARD DE PROGRESSO DA META
   ============================================================ */
function ProgressCard({
  representativeId,
  total,
  faltam,
  metaAtingida,
}: {
  representativeId: string;
  total: number;
  faltam: number;
  metaAtingida: boolean;
}) {
  const ringRadius = 76;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const initialGoalProgress = Math.min(
    Math.round((total / META_CONVITES) * 100),
    100,
  );
  const invitationsAfterGoal = Math.max(total - META_CONVITES, 0);
  const confirmedGoalInvitations = Math.min(total, META_CONVITES);
  const goalSlots = Array.from(
    { length: META_CONVITES },
    (_unused, index) => index + 1,
  );
  const ringOffset = ringCircumference * (1 - initialGoalProgress / 100);
  const ringColor = metaAtingida ? "#22C55E" : "#C41230";
  const [achievement, setAchievement] = useState<AchievementNotice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !metaAtingida) return;

    const storageKey = `alpha-progress-meta-achievement:v2:${representativeId}`;
    if (window.localStorage.getItem(storageKey)) return;

    window.localStorage.setItem(storageKey, "seen");
    setAchievement(META_ACHIEVEMENT);
  }, [metaAtingida, representativeId]);

  function focusShareCard() {
    setAchievement(null);
    document
      .querySelector<HTMLElement>('[data-dashboard-tour="share-access"]')
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div
      data-dashboard-tour="progress"
      className="relative overflow-hidden rounded-[22px] border p-5 sm:p-6 md:p-8"
      style={{
        background: "#FAF9F6",
        borderColor: "#D8D4CC",
        boxShadow: "0 14px 38px rgba(17,18,16,0.06)",
      }}
    >
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6F6D68] sm:block">
            Acompanhe sua turma
          </p>
          <h2 className="mt-2 text-[27px] font-light tracking-[-0.04em] text-[#111210] sm:text-[32px]">
            Progresso da turma
          </h2>
        </div>

        {metaAtingida ? (
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#0a7d3a]/10 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#0a7d3a] sm:self-auto">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5L20 7" />
            </svg>
            Meta inicial concluída
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-[#D8D4CC] bg-[#F8F7F3] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#6F6D68] sm:self-auto">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C41230]" />
            {faltam} para a meta inicial
          </span>
        )}
      </div>

      <div className="relative mt-6 grid gap-4 lg:grid-cols-[minmax(270px,0.82fr)_minmax(0,1.45fr)]">
        <section
          className="relative isolate flex flex-col justify-center overflow-hidden rounded-[18px] border p-5 text-[#111210] sm:p-6"
          style={{ background: "#F8F7F3", borderColor: "#D8D4CC" }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(17,18,16,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(17,18,16,0.05) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative flex items-center justify-center gap-5">
            <div className="relative grid h-[154px] w-[154px] shrink-0 place-items-center">
              <svg
                aria-label={`${initialGoalProgress}% da meta inicial atingida`}
                className="absolute inset-0 -rotate-90"
                viewBox="0 0 180 180"
                role="img"
              >
                <circle
                  cx="90"
                  cy="90"
                  r={ringRadius}
                  fill="none"
                  stroke="#E8E5DF"
                  strokeWidth="10"
                />
                <circle
                  cx="90"
                  cy="90"
                  r={ringRadius}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
                />
              </svg>
              <div className="relative text-center">
                <p className="text-[38px] font-light leading-none tracking-[-0.06em] tabular-nums">
                  {initialGoalProgress}
                  <span className="text-lg">%</span>
                </p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#6F6D68]">
                  meta inicial
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F6D68]">
                {metaAtingida ? "Meta concluída" : "Meta inicial"}
              </p>
              <p className="mt-2 text-[20px] font-medium leading-none tracking-[-0.04em] text-[#111210]">
                {metaAtingida ? "30 convites confirmados" : "Chegar a 30 convites"}
              </p>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="text-[34px] font-light leading-none tracking-[-0.06em] tabular-nums">
                  {metaAtingida ? META_CONVITES : total}
                </span>
                <span className="text-sm text-[#8A8781]">/ {META_CONVITES}</span>
              </p>
              <p className="mt-3 text-sm leading-5 text-[#3A3A3A]">
                {metaAtingida
                  ? "A equipe Alpha vai falar com você."
                  : `Faltam ${faltam} ${faltam === 1 ? "convite" : "convites"}.`}
              </p>
            </div>
          </div>

        </section>

        <section
          className="rounded-[18px] border p-5 sm:p-6"
          style={{ background: "#F8F7F3", borderColor: "#D8D4CC" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F6D68]">
                Convites na lista
              </p>
              {!metaAtingida && (
                <p className="mt-1 hidden text-sm leading-5 text-[#3A3A3A] sm:block">
                  Cada bloco é um convite confirmado.
                </p>
              )}
            </div>
            <span className="whitespace-nowrap text-[15px] font-semibold tabular-nums text-[#111210]">
              {formatInviteCount(total)}
            </span>
          </div>

          <div className="mt-5 rounded-[14px] border border-[#D8D4CC] bg-[#FAF9F6] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6D68]">
                Meta inicial
              </p>
              <span className="text-[11px] font-semibold tabular-nums text-[#111210]">
                {confirmedGoalInvitations} de {META_CONVITES}
              </span>
            </div>
            <div
              aria-label={`${confirmedGoalInvitations} de ${META_CONVITES} convites preenchidos na meta inicial`}
              className="mt-3 grid grid-cols-10 gap-1 sm:gap-1.5"
              role="img"
            >
              {goalSlots.map((slot) => {
                const confirmed = slot <= confirmedGoalInvitations;
                return (
                  <span
                    key={slot}
                    className="h-3 rounded-[3px] transition-colors duration-500 sm:h-4"
                    style={{
                      background: confirmed
                        ? metaAtingida
                          ? "#16A34A"
                          : "#111210"
                        : "#E8E5DF",
                    }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[9px] font-medium uppercase tracking-[0.12em] text-[#8A8781]">
              <span>0</span>
              <span>{META_CONVITES} convites</span>
            </div>
          </div>

          <div className="mt-4 rounded-[14px] border border-[#D8D4CC] bg-[#FAF9F6] p-3.5">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6D68]">
                  {metaAtingida ? "Convites extras" : "Próximo passo"}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#111210]">
                  {metaAtingida
                    ? `+${formatInviteCount(invitationsAfterGoal)} depois da meta`
                    : `Faltam ${faltam} ${faltam === 1 ? "convite" : "convites"}`}
                </p>
              </div>
              <p className="hidden max-w-[340px] text-sm leading-5 text-[#6F6D68] sm:block sm:text-right">
                {metaAtingida
                  ? "Continue enviando o link: quanto mais gente, melhor."
                  : "Envie o link para a turma."}
              </p>
            </div>
          </div>
        </section>
      </div>


      {achievement && (
        <AchievementModal
          notice={achievement}
          onClose={() => setAchievement(null)}
          onShare={focusShareCard}
        />
      )}
    </div>
  );
}

function AchievementModal({
  notice,
  onClose,
  onShare,
}: {
  notice: AchievementNotice;
  onClose: () => void;
  onShare: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-[#111210]/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={notice.title}
        className="relative w-full max-w-[440px] overflow-hidden rounded-[24px] border p-6 sm:p-8"
        style={{
          background: "#FAF9F6",
          borderColor: "#D8D4CC",
          boxShadow: "0 28px 72px rgba(17,18,16,0.32)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#16A34A]" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-[#6F6D68] transition-colors hover:bg-black/[0.05] hover:text-[#111210]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#16A34A]/10 text-[#0A7D3A]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M8 3h8v4a4 4 0 01-8 0V3zM7 5H4v1a4 4 0 004 4M17 5h3v1a4 4 0 01-4 4M12 11v6M8 21h8M9 17h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0A7D3A]">
          {notice.eyebrow}
        </p>
        <h3 className="mt-2 max-w-[330px] text-[30px] font-light leading-none tracking-[-0.04em] text-[#111210] sm:text-[34px]">
          {notice.title}
        </h3>
        <p className="mt-4 text-sm leading-6 text-[#5D5B56]">{notice.description}</p>

        <div className="mt-5 rounded-[12px] border border-[#D8D4CC] bg-[#F8F7F3] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6F6D68]">
            Próximo passo
          </p>
          <p className="mt-1 text-sm font-semibold text-[#111210]">{notice.next}</p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F6D68] transition-colors hover:text-[#111210]"
          >
            Entendi
          </button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#111210] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(17,18,16,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Compartilhar link
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CARDS DE RESUMO
   ============================================================ */
function ResumoCards({
  totalConvites,
  participantes,
  faltam,
  metaAtingida,
}: {
  totalConvites: number;
  participantes: number;
  faltam: number;
  metaAtingida: boolean;
}) {
  const cards = [
    { label: "Convites confirmados", value: formatInviteCount(totalConvites) },
    { label: "Participantes", value: formatInviteCount(participantes) },
    {
      label: "Faltam para a meta mínima",
      value: metaAtingida ? "Meta atingida" : formatInviteCount(faltam),
      positive: metaAtingida,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-[16px] border px-5 py-5"
          style={{
            background: "#FAF9F6",
            borderColor: "#D8D4CC",
            boxShadow: "0 10px 28px rgba(17,18,16,0.05)",
          }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-text-tertiary">
            {c.label}
          </p>
          <p
            className={`mt-2.5 tracking-tight ${
              c.positive
                ? "font-serif text-2xl text-[#0a7d3a]"
                : "text-[32px] font-bold leading-none tabular-nums text-[#0A0A0A]"
            }`}
          >
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   LISTA DA TURMA (edição inline)
   ============================================================ */
function TurmaList({
  list,
  loading,
  curso,
  justJoined,
  onReload,
  onAdd,
  onMutate,
}: {
  list: StudentRow[];
  loading: boolean;
  curso: string;
  justJoined: string | null;
  onReload: () => Promise<void>;
  onAdd: () => void;
  onMutate: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQtd, setEditQtd] = useState("1");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  function startEdit(s: StudentRow) {
    setEditingId(s.id);
    setEditQtd(String(s.qtd_convites || 1));
    setEditError(null);
  }

  async function saveEdit(id: string) {
    const parsed = parseInt(editQtd, 10);
    if (!parsed || parsed < 1 || parsed > MAX_CONVITES_POR_PESSOA) {
      setEditError("Digite uma quantidade de 1 a 10.000 convites.");
      return;
    }

    setEditError(null);
    setBusyId(id);
    const { error } = await supabase
      .from("students")
      .update({ qtd_convites: parsed })
      .eq("id", id)
      .select("id")
      .single();
    setBusyId(null);

    if (error) {
      setEditError(
        error.code === "23514"
          ? "A lista ainda não aceita essa quantidade. Tente atualizar a página e salvar de novo."
          : "Não foi possível salvar agora. Tente novamente.",
      );
      return;
    }

    setEditingId(null);
    await onReload();
    window.dispatchEvent(new CustomEvent("adesoes:refresh"));
    onMutate();
  }

  async function removeStudent(id: string, name: string) {
    if (!window.confirm(`Remover ${name} da lista?`)) return;
    setBusyId(id);
    const { error } = await supabase.from("students").delete().eq("id", id);
    setBusyId(null);
    if (!error) {
      await onReload();
      window.dispatchEvent(new CustomEvent("adesoes:refresh"));
      onMutate();
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-[18px] border p-6 md:p-7"
      style={{
        background: "#FAF9F6",
        borderColor: "#D8D4CC",
        boxShadow: "0 14px 38px rgba(17,18,16,0.06)",
      }}
    >
      <style jsx>{`
        @keyframes memberIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>

      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            background: list.length ? "#13b85a" : "#9ca3af",
            boxShadow: list.length ? "0 0 8px rgba(19,184,90,0.6)" : "none",
          }}
        />
        <h3 className="font-serif text-xl tracking-tight text-[#0A0A0A]">
          Turma em movimento
        </h3>
      </div>
      <p className="mt-1.5 text-sm text-text-tertiary">
        Adicione colegas e acompanhe a quantidade de convites da turma.
      </p>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full bg-black/[0.05]"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 37%, rgba(0,0,0,0.04) 63%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.4s infinite",
                  }}
                />
                <div className="h-3 w-1/3 rounded bg-black/[0.05]" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {list.map((s, i) => (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-colors duration-300 hover:border-black/[0.05] hover:bg-black/[0.015] sm:flex-row sm:items-center"
                style={{
                  background:
                    justJoined === s.id ? "rgba(19,184,90,0.07)" : undefined,
                }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="w-5 shrink-0 text-center text-xs font-medium tabular-nums text-text-tertiary">
                    {i + 1}
                  </span>
                  <Avatar name={s.full_name} index={i} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0A0A0A]">
                      {s.full_name}
                      {justJoined === s.id && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-[#0a7d3a]">
                          entrou agora
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-text-tertiary">{curso}</p>
                  </div>
                </div>

                {editingId === s.id ? (
                  <div className="pl-8 sm:pl-0">
                    <div className="flex items-center gap-2">
                      <input
                        inputMode="numeric"
                        value={editQtd}
                        onChange={(e) =>
                          setEditQtd(e.target.value.replace(/\D/g, "").slice(0, 5))
                        }
                        className="w-20 rounded-md border border-line bg-white px-2 py-1.5 text-center text-sm focus:border-ink focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(s.id);
                          if (e.key === "Escape") {
                            setEditError(null);
                            setEditingId(null);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(s.id)}
                        disabled={busyId === s.id}
                        className="rounded-md bg-[#0a7d3a] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#13b85a] disabled:opacity-50"
                      >
                        {busyId === s.id ? "Salvando" : "OK"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditError(null);
                          setEditingId(null);
                        }}
                        className="text-text-tertiary transition-colors hover:text-text-primary"
                        aria-label="Cancelar"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </div>
                    {editError && (
                      <p className="mt-1.5 max-w-[210px] text-xs leading-4 text-[#C41230]">
                        {editError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">
                    <button
                      type="button"
                      data-dashboard-tour="edit-invites"
                      onClick={() => startEdit(s)}
                      className="group/qtd flex items-center gap-3 rounded-xl border border-black/[0.08] bg-white/80 py-1.5 pl-4 pr-3.5 transition-all duration-200 hover:border-[#0a7d3a]/40 hover:bg-[#0a7d3a]/[0.04]"
                      aria-label="Editar quantidade de convites"
                    >
                      <span className="flex items-baseline gap-1.5">
                        <span className="min-w-[2.75rem] text-right text-[22px] font-bold leading-none tabular-nums text-[#0A0A0A]">
                          {formatInviteCount(s.qtd_convites)}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-text-tertiary">
                          {s.qtd_convites === 1 ? "convite" : "convites"}
                        </span>
                      </span>
                      <span className="h-7 w-px bg-black/[0.08]" />
                      <span className="inline-flex w-[58px] items-center justify-center gap-1.5 text-[11px] font-semibold text-[#0a7d3a]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
                        </svg>
                        Editar
                      </span>
                    </button>
                    {i > 0 ? (
                      <button
                        type="button"
                        onClick={() => removeStudent(s.id, s.full_name)}
                        disabled={busyId === s.id}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-wine/8 hover:text-wine disabled:opacity-50"
                        aria-label="Remover aluno"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                        </svg>
                      </button>
                    ) : (
                      <span className="h-8 w-8" aria-hidden />
                    )}
                  </div>
                )}
              </li>
            ))}

            {/* Linha Adicionar aluno */}
            <li>
              <button
                type="button"
                data-dashboard-tour="add-student"
                onClick={onAdd}
                className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-black/[0.14] px-2.5 py-3 text-left transition-all duration-300 hover:border-[#C41230]/50 hover:bg-[#C41230]/[0.03]"
              >
                <span className="w-5 shrink-0 text-center text-xs font-medium text-text-tertiary">
                  {list.length + 1}
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-black/20 text-text-tertiary transition-colors group-hover:border-[#C41230]/60 group-hover:text-[#C41230]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span className="text-sm font-medium text-text-secondary transition-colors group-hover:text-text-primary">
                  Adicionar aluno
                </span>
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

function Avatar({ name, index }: { name: string; index: number }) {
  const { bg, fg } = getAvatarColor(name);
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tracking-tight"
      style={{
        background: bg,
        color: fg,
        animation: `memberIn 0.5s cubic-bezier(0.22,0.61,0.36,1) ${index * 0.05}s both`,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

/* ============================================================
   CARD DE COMPARTILHAMENTO (compacto)
   ============================================================ */
export function ShareCard({
  url,
  nome,
  curso,
  instituicao,
}: {
  url: string;
  nome: string;
  curso: string;
  instituicao: string;
}) {
  const [copied, setCopied] = useState(false);
  const [qrFeedback, setQrFeedback] = useState<string | null>(null);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op */
    }
  }

  function flashFeedback(msg: string) {
    setQrFeedback(msg);
    setTimeout(() => setQrFeedback(null), 2200);
  }

  async function buildPremiumQrImage(): Promise<Blob | null> {
    const qrCanvas = qrWrapperRef.current?.querySelector("canvas") ?? null;
    if (!qrCanvas) return null;
    return buildQrPosterBlob({ qrCanvas, curso, instituicao, url });
  }

  async function downloadQr() {
    const blob = await buildPremiumQrImage();
    if (!blob) return;
    const filename = `convite-${slugifyFile(curso)}-${slugifyFile(instituicao)}.png`;
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
    flashFeedback("Imagem baixada");
  }

  const waShareUrl = buildWhatsAppShareUrl({
    nomeUsuario: nome,
    curso,
    instituicao,
    linkAdesao: url,
    linkVideo: absoluteUrl(PROMO_VIDEO_PATH),
  });

  const shortUrl = url.replace(/^https?:\/\//, "");

  return (
    <div
      className="relative flex min-w-0 items-center gap-3 overflow-hidden rounded-[14px] border p-3 sm:gap-4 sm:p-3.5"
      style={{
        background: "#F8F7F3",
        borderColor: "#D8D4CC",
        boxShadow: "0 8px 24px rgba(17,18,16,0.05)",
      }}
    >
      {/* QR pequeno */}
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <div
          ref={qrWrapperRef}
          className="rounded-lg border border-line bg-white p-1.5"
        >
          <QRCodeCanvas
            value={url}
            size={64}
            bgColor="#FFFFFF"
            fgColor="#0A0A0A"
            level="M"
          />
        </div>
        <button
          type="button"
          onClick={downloadQr}
          className="text-[8.5px] uppercase tracking-[0.12em] text-text-tertiary transition-colors hover:text-text-primary"
          aria-label="Baixar QR Code"
        >
          {qrFeedback ? (
            <span className="text-[#0a7d3a]">{qrFeedback}</span>
          ) : (
            "Baixar QR"
          )}
        </button>
      </div>

      {/* Conteúdo: título + link + ações */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-text-tertiary sm:text-[11px] sm:tracking-[0.16em]">
          Compartilhar acesso
        </p>
        <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-line bg-white/70 px-2.5 py-1.5">
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-text-secondary">
            {shortUrl}
          </span>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-text-primary transition-colors hover:text-[#C41230]"
          >
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <a
          href={waShareUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-primary transition-all duration-300 hover:border-[#25D366]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
          </svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL ADICIONAR ALUNO
   ============================================================ */
function AddStudentModal({
  representativeId,
  url,
  nome,
  curso,
  instituicao,
  onClose,
  onDone,
}: {
  representativeId: string;
  url: string;
  nome: string;
  curso: string;
  instituicao: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    nome: "",
    whatsapp: "",
    email: "",
    qtd: "1",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  async function submit() {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Informe o nome.";
    if (!isValidPhoneBr(form.whatsapp)) e.whatsapp = "WhatsApp inválido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "E-mail inválido.";
    const qtd = parseInt(form.qtd, 10);
    if (!qtd || qtd < 1 || qtd > MAX_CONVITES_POR_PESSOA) {
      e.qtd = "Informe uma quantidade entre 1 e 10.000 convites.";
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    const { error } = await supabase.from("students").insert({
      representative_id: representativeId,
      full_name: form.nome.trim().toUpperCase(),
      phone: onlyDigits(form.whatsapp),
      email: form.email.trim().toLowerCase(),
      qtd_convites: qtd,
    });
    setSaving(false);

    if (error?.code === "23505") {
      setErrors({ email: "Este e-mail já está na turma." });
      return;
    }
    if (error) {
      setErrors({ nome: error.message });
      return;
    }
    onDone();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op */
    }
  }

  const waShareUrl = buildWhatsAppShareUrl({
    nomeUsuario: nome,
    curso,
    instituicao,
    linkAdesao: url,
    linkVideo: absoluteUrl(PROMO_VIDEO_PATH),
  });

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: "rgba(17,18,16,0.54)",
        backdropFilter: "blur(7px)",
      }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[580px] overflow-hidden rounded-[24px] border p-6 sm:p-8"
        style={{
          background: AUTH.warmWhite,
          borderColor: AUTH.border,
          boxShadow: "0 28px 72px rgba(17,18,16,0.28)",
        }}
        onClick={(ev) => ev.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-[#6F6D68] transition-colors hover:bg-black/[0.05] hover:text-[#111210]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="pr-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6F6D68]">
            Participante da turma
          </p>
          <h3 className="mt-2 text-[30px] font-light leading-none tracking-[-0.04em] text-[#111210] sm:text-[34px]">
            Adicionar aluno à turma
          </h3>
          <p className="mt-3 max-w-[430px] text-sm leading-6 text-[#6F6D68]">
            Cadastre um colega manualmente ou compartilhe o link para ele preencher.
          </p>
        </div>

        <div className="mt-7 space-y-3.5">
          <Input
            label="Nome completo"
            name="nome"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value.toUpperCase())}
            error={errors.nome}
            variant="auth"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <PhoneInput
              label="WhatsApp"
              value={form.whatsapp}
              onChange={(v) => set("whatsapp", v)}
              error={errors.whatsapp}
              variant="auth"
            />
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              variant="auth"
            />
          </div>
          <Input
            label="Quantidade de convites"
            name="qtd"
            inputMode="numeric"
            value={form.qtd}
            onChange={(e) =>
              set("qtd", e.target.value.replace(/\D/g, "").slice(0, 5))
            }
            error={errors.qtd}
            variant="auth"
          />
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center">
            <AuthButton
              type="button"
              onClick={submit}
              loading={saving}
              loadingLabel="Adicionando..."
              style={{ width: "auto", paddingInline: 24 }}
            >
              Adicionar à lista
            </AuthButton>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-[#6F6D68] transition-colors hover:text-[#111210]"
            >
              Cancelar
            </button>
          </div>
        </div>

        <div
          className="mt-7 rounded-[14px] border p-4"
          style={{ background: AUTH.fieldBg, borderColor: AUTH.border }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6F6D68]">
            Ou compartilhe o acesso da turma
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border bg-[#FAF9F6] px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111210] transition-colors hover:border-[#111210]"
              style={{ borderColor: AUTH.border }}
            >
              {copied ? "Link copiado" : "Copiar link"}
            </button>
            <a
              href={waShareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] border bg-[#FAF9F6] px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111210] transition-all hover:border-[#25D366]"
              style={{ borderColor: AUTH.border }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
