"use client";

import { useEffect, useState } from "react";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { supabase } from "@/lib/supabase";

interface Props {
  representativeId: string;
  representativeEmail: string;
}

export default function MinhaAdesaoCard({
  representativeId,
  representativeEmail,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [qtd, setQtd] = useState("1");
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("students")
        .select("id, qtd_convites")
        .eq("representative_id", representativeId)
        .ilike("email", representativeEmail)
        .maybeSingle();

      if (data) {
        setStudentId(data.id);
        setQtd(String(data.qtd_convites || 1));
      }
      setLoading(false);
    })();
  }, [representativeId, representativeEmail]);

  async function handleSave() {
    setError(undefined);
    const parsed = parseInt(qtd, 10);
    if (!parsed || parsed < 1) {
      setError("Informe uma quantidade válida.");
      return;
    }
    if (!studentId) {
      setError(
        "Sua adesão ainda não foi registrada. Atualize a página e tente novamente.",
      );
      return;
    }

    setSaving(true);
    try {
      const { data: updated, error: updErr } = await supabase
        .from("students")
        .update({ qtd_convites: parsed })
        .eq("id", studentId)
        .select("id");

      if (updErr) throw updErr;
      if (!updated || updated.length === 0) {
        throw new Error(
          "Sem permissão para atualizar. Atualize a página e tente novamente.",
        );
      }

      // Notifica outros componentes do dashboard para recarregar o total
      window.dispatchEvent(new CustomEvent("adesoes:refresh"));

      // Dispara checagem de meta caso a alteração tenha levado a turma a 30+
      fetch("/api/notify-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ representative_id: representativeId }),
      }).catch(() => {});

      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);
    } catch (err: any) {
      setError(err?.message || "Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const shell =
    "relative overflow-hidden rounded-2xl border border-black/[0.06] p-6 md:p-8";
  const shellStyle = {
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)",
    backdropFilter: "blur(12px)",
    boxShadow:
      "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -16px rgba(0,0,0,0.08)",
  } as const;

  if (loading) {
    return (
      <div className={shell} style={shellStyle}>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-tertiary">
          Sua participação
        </p>
        <p className="mt-4 text-sm text-text-tertiary">Carregando…</p>
      </div>
    );
  }

  return (
    <div className={shell} style={shellStyle}>
      <div className="relative">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-tertiary">
          Sua participação
        </p>
        <h3 className="mt-3 font-serif text-2xl leading-tight tracking-tight text-[#0A0A0A]">
          Você também faz parte desta turma!
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3a3a3a]">
          Selecione a quantidade de convites que pretende adquirir. Você pode atualizar essa informação quando quiser.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Quantos convites você pretende?"
              name="qtd_convites"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qtd}
              onChange={(e) =>
                setQtd(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              error={error}
            />
          </div>
          <Button onClick={handleSave} loading={saving} type="button">
            {savedFeedback ? "Salvo ✓" : saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
