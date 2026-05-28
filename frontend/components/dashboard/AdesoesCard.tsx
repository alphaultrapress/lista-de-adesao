"use client";

import { useEffect, useState } from "react";
import { supabase, Student } from "@/lib/supabase";
import { getInitials, getAvatarColor } from "@/lib/avatar";
import { isValidCpf, isValidPhoneBr, onlyDigits } from "@/lib/cpf";
import Input from "../ui/Input";
import Button from "../ui/Button";
import CpfInput from "../forms/CpfInput";
import PhoneInput from "../forms/PhoneInput";

interface Props {
  representativeId: string;
  curso: string;
}

type StudentRow = Pick<
  Student,
  "id" | "full_name" | "created_at" | "qtd_convites"
>;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} d`;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
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

export default function AdesoesCard({ representativeId, curso }: Props) {
  const [list, setList] = useState<StudentRow[]>([]);
  const [count, setCount] = useState(0);
  const [totalConvites, setTotalConvites] = useState(0);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(0);
  const [justJoined, setJustJoined] = useState<string | null>(null);

  const [manage, setManage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQtd, setEditQtd] = useState("1");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (count === 0) {
      setDisplayCount(0);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const from = displayCount;
    const dur = 900;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayCount(Math.round(from + (count - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  async function load(highlightNewest = false) {
    const { data, count: c } = await supabase
      .from("students")
      .select("id, full_name, created_at, qtd_convites", { count: "exact" })
      .eq("representative_id", representativeId)
      .order("created_at", { ascending: false });
    const rows = (data as StudentRow[]) || [];
    if (highlightNewest && rows[0]) {
      setJustJoined(rows[0].id);
      setTimeout(() => setJustJoined(null), 3000);
    }
    setList(rows);
    setCount(c || 0);
    setTotalConvites(rows.reduce((s, r) => s + (r.qtd_convites || 0), 0));
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`students-${representativeId}`)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [representativeId]);

  function startEdit(s: StudentRow) {
    setEditingId(s.id);
    setEditQtd(String(s.qtd_convites || 1));
  }

  async function saveEdit(id: string) {
    const parsed = parseInt(editQtd, 10);
    if (!parsed || parsed < 1) return;
    setBusyId(id);
    const { error } = await supabase
      .from("students")
      .update({ qtd_convites: parsed })
      .eq("id", id);
    setBusyId(null);
    if (!error) {
      setEditingId(null);
      await load();
      window.dispatchEvent(new CustomEvent("adesoes:refresh"));
    }
  }

  async function removeStudent(id: string, name: string) {
    if (!window.confirm(`Remover ${name} da lista?`)) return;
    setBusyId(id);
    const { error } = await supabase.from("students").delete().eq("id", id);
    setBusyId(null);
    if (!error) {
      await load();
      window.dispatchEvent(new CustomEvent("adesoes:refresh"));
    }
  }

  const ativa = count > 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-black/[0.06] p-6 md:p-8"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -16px rgba(0,0,0,0.08)",
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
        @keyframes livePulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.85);
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

      {/* Header: status vivo */}
      <div className="relative flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: ativa ? "#13b85a" : "#9ca3af",
              boxShadow: ativa ? "0 0 8px rgba(19,184,90,0.6)" : "none",
              animation: ativa ? "livePulse 2s ease-in-out infinite" : "none",
            }}
          />
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#3a3a3a]">
            {ativa ? "Turma em movimento" : "Aguardando primeiras adesões"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setManage((m) => !m);
            setEditingId(null);
            setShowAdd(false);
          }}
          className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary transition-colors hover:text-text-primary"
        >
          {manage ? "Concluir" : "Gerenciar"}
        </button>
      </div>

      {/* Contador hierarquizado */}
      <div className="relative mt-7 flex items-end gap-5">
        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="font-serif text-[64px] leading-none tracking-tight text-[#0A0A0A]">
              {displayCount}
            </span>
            <span className="text-sm font-medium text-[#3a3a3a]">
              {count === 1 ? "membro" : "membros"}
            </span>
          </div>
          <p className="mt-2 text-[13px] text-text-tertiary">
            {totalConvites}{" "}
            {totalConvites === 1
              ? "convite previsto pela turma"
              : "convites previstos pela turma"}
          </p>
        </div>
      </div>

      {/* Linha sutil */}
      <div className="relative mt-7 h-px w-full bg-black/[0.06]" />

      {/* Lista de membros */}
      <div className="relative mt-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-tertiary">
            {ativa ? "Quem já está na turma" : "Ninguém entrou ainda"}
          </p>
          {manage && (
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0a7d3a] transition-opacity hover:opacity-70"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Adicionar aluno
            </button>
          )}
        </div>

        {showAdd && (
          <AddStudentForm
            representativeId={representativeId}
            onDone={async () => {
              setShowAdd(false);
              await load();
              window.dispatchEvent(new CustomEvent("adesoes:refresh"));
            }}
            onCancel={() => setShowAdd(false)}
          />
        )}

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
                <div className="flex-1">
                  <div
                    className="h-3 w-1/3 rounded bg-black/[0.05]"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 37%, rgba(0,0,0,0.04) 63%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.4s infinite",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-black/[0.05] bg-white/50 px-5 py-8 text-center">
            <p className="text-sm text-[#3a3a3a]">
              Sua turma está pronta para começar.
            </p>
            <p className="mt-1.5 text-xs text-text-tertiary">
              Compartilhe o link e veja o grupo crescer em tempo real.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {(manage ? list : list.slice(0, 8)).map((s, i) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-300"
                style={{
                  background:
                    justJoined === s.id
                      ? "rgba(19,184,90,0.07)"
                      : "transparent",
                }}
              >
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
                  <p className="text-xs text-text-tertiary">{curso}</p>
                </div>

                {manage ? (
                  editingId === s.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        inputMode="numeric"
                        value={editQtd}
                        onChange={(e) =>
                          setEditQtd(
                            e.target.value.replace(/\D/g, "").slice(0, 4),
                          )
                        }
                        className="w-16 rounded-md border border-line bg-white px-2 py-1.5 text-center text-sm focus:border-ink focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(s.id)}
                        disabled={busyId === s.id}
                        className="rounded-md bg-[#0a7d3a] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#13b85a] disabled:opacity-50"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-text-tertiary transition-colors hover:text-text-primary"
                        aria-label="Cancelar"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-black/[0.04] hover:text-text-primary"
                        aria-label="Editar convites"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
                        </svg>
                      </button>
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
                    </div>
                  )
                ) : (
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-[#0A0A0A]">
                      {s.qtd_convites}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-text-tertiary">
                      {s.qtd_convites === 1 ? "convite" : "convites"}
                    </p>
                  </div>
                )}
              </li>
            ))}
            {!manage && list.length > 8 && (
              <li className="px-2 pt-2 text-xs text-text-tertiary">
                + {list.length - 8} outros na turma
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddStudentForm({
  representativeId,
  onDone,
  onCancel,
}: {
  representativeId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    cpf: "",
    nome: "",
    whatsapp: "",
    email: "",
    qtd: "1",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  }

  async function submit() {
    const e: Record<string, string> = {};
    if (!isValidCpf(form.cpf)) e.cpf = "CPF inválido.";
    if (!form.nome.trim()) e.nome = "Informe o nome.";
    if (!isValidPhoneBr(form.whatsapp)) e.whatsapp = "WhatsApp inválido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "E-mail inválido.";
    const qtd = parseInt(form.qtd, 10);
    if (!qtd || qtd < 1) e.qtd = "Quantidade inválida.";
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    const { error } = await supabase.from("students").insert({
      representative_id: representativeId,
      cpf: onlyDigits(form.cpf),
      full_name: form.nome.trim(),
      birth_date: null,
      phone: onlyDigits(form.whatsapp),
      email: form.email.trim().toLowerCase(),
      qtd_convites: qtd,
    });
    setSaving(false);

    if (error?.code === "23505") {
      setErrors({ cpf: "Este CPF já está na turma." });
      return;
    }
    if (error) {
      setErrors({ cpf: error.message });
      return;
    }
    onDone();
  }

  return (
    <div className="mb-4 rounded-xl border border-black/[0.07] bg-white/70 p-4">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-text-tertiary">
        Adicionar aluno manualmente
      </p>
      <div className="space-y-3">
        <CpfInput
          value={form.cpf}
          onChange={(v) => set("cpf", v)}
          onResolved={(d) => {
            if (d.nome) set("nome", d.nome);
          }}
          error={errors.cpf}
        />
        <Input
          label="Nome completo"
          name="nome"
          value={form.nome}
          onChange={(e) => set("nome", e.target.value)}
          error={errors.nome}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <PhoneInput
            label="WhatsApp"
            value={form.whatsapp}
            onChange={(v) => set("whatsapp", v)}
            error={errors.whatsapp}
          />
          <Input
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            error={errors.email}
          />
        </div>
        <Input
          label="Quantos convites?"
          name="qtd"
          inputMode="numeric"
          value={form.qtd}
          onChange={(e) =>
            set("qtd", e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          error={errors.qtd}
        />
        <div className="flex items-center gap-2 pt-1">
          <Button onClick={submit} loading={saving} type="button">
            {saving ? "Adicionando…" : "Adicionar"}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3.5 text-[11px] uppercase tracking-premium-wide text-text-tertiary transition-colors hover:text-text-primary"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
