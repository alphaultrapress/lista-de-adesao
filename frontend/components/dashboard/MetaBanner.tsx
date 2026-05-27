"use client";

import { useEffect, useState } from "react";
import { supabase, META_CONVITES } from "@/lib/supabase";

interface Props {
  representativeId: string;
}

export default function MetaBanner({ representativeId }: Props) {
  const [total, setTotal] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("students")
      .select("qtd_convites")
      .eq("representative_id", representativeId);
    const sum = (data || []).reduce(
      (s, r: any) => s + (r.qtd_convites || 0),
      0,
    );
    setTotal(sum);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`students-banner-${representativeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
          filter: `representative_id=eq.${representativeId}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [representativeId]);

  if (total < META_CONVITES || dismissed) return null;

  return (
    <div
      className="relative mb-8 overflow-hidden rounded-[6px] border border-[#0a7d3a]/30 fade-up"
      style={{
        background:
          "linear-gradient(135deg, rgba(10,125,58,0.08) 0%, rgba(19,184,90,0.05) 100%)",
      }}
    >
      <div className="relative flex items-center gap-5 p-5 md:p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0a7d3a]/15">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0a7d3a"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-premium-widest text-[#0a7d3a]">
            Meta atingida · {total} convites
          </p>
          <p className="mt-1.5 font-serif text-lg leading-snug text-text-primary md:text-xl">
            Lista enviada com sucesso!{" "}
            <span className="italic font-light text-[#0a7d3a]">
              Um consultor entrará em contato em breve.
            </span>
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            Sua turma já bateu a meta de {META_CONVITES} convites. A equipe Alpha
            foi notificada e logo entra em contato pelo WhatsApp para apresentar
            as possibilidades.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fechar aviso"
          className="shrink-0 self-start p-1 text-text-tertiary transition-colors hover:text-text-primary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
