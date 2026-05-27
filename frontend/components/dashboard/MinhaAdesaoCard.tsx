"use client";

import { useEffect, useState } from "react";
import Card from "../ui/Card";
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
      const { error: updErr } = await supabase
        .from("students")
        .update({ qtd_convites: parsed })
        .eq("id", studentId);

      if (updErr) throw updErr;

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

  if (loading) {
    return (
      <Card title="Sua adesão" subtitle="Carregando…">
        <p className="text-sm text-text-tertiary">Buscando seus dados…</p>
      </Card>
    );
  }

  return (
    <Card
      title="Sua adesão"
      subtitle="Você já está na lista. Ajuste abaixo quantos convites pretende."
    >
      <div className="grid items-end gap-5 md:grid-cols-[1fr,auto]">
        <Input
          label="Quantos convites você deseja?"
          name="qtd_convites"
          inputMode="numeric"
          pattern="[0-9]*"
          value={qtd}
          onChange={(e) =>
            setQtd(e.target.value.replace(/\D/g, "").slice(0, 4))
          }
          hint="Quantidade aproximada de convites. Você pode ajustar quando quiser."
          error={error}
        />
        <Button onClick={handleSave} loading={saving} type="button">
          {savedFeedback ? "Salvo ✓" : saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </Card>
  );
}
