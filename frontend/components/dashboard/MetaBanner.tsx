"use client";

import { useEffect, useRef, useState } from "react";
import { supabase, META_CONVITES } from "@/lib/supabase";

interface Props {
  representativeId: string;
}

export default function MetaBanner({ representativeId }: Props) {
  const [total, setTotal] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const prevReached = useRef<boolean | null>(null);

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

    const reached = sum >= META_CONVITES;
    // dispara confete só na transição de não-atingido -> atingido
    if (prevReached.current === false && reached) {
      setCelebrate(true);
      setDismissed(false);
      setTimeout(() => setCelebrate(false), 2600);
    }
    prevReached.current = reached;
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

    const onRefresh = () => load();
    window.addEventListener("adesoes:refresh", onRefresh);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("adesoes:refresh", onRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [representativeId]);

  const liberada = total >= META_CONVITES;
  if (!liberada || dismissed) return null;

  return (
    <div
      className="relative mb-8 overflow-hidden rounded-2xl border border-black/[0.06] fade-up"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.65) 100%)",
        backdropFilter: "blur(12px)",
        boxShadow:
          "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -16px rgba(0,0,0,0.08)",
      }}
    >
      {celebrate && <Confetti />}

      <div className="relative flex items-center gap-5 p-5 md:p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0a7d3a]/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a7d3a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>

        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            Experiência ativada
          </p>
          <p className="mt-1.5 font-serif text-lg leading-snug text-text-primary md:text-xl">
            Sua turma avançou para a{" "}
            <span className="italic font-light text-[#0A0A0A]">
              próxima etapa.
            </span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#3a3a3a]">
            O grupo ganhou força e nossa equipe já está preparando algo
            especial. Continue convidando — quanto mais gente, melhor a
            experiência da turma.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fechar"
          className="shrink-0 self-start p-1 text-text-tertiary transition-colors hover:text-text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 28 });
  const colors = ["#13b85a", "#0a7d3a", "#B8923E", "#1A1410", "#3a5a82"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const dur = 1.6 + Math.random() * 1.2;
        const size = 5 + Math.random() * 5;
        const color = colors[i % colors.length];
        const rotate = Math.random() * 360;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-10px",
              width: size,
              height: size * 1.6,
              background: color,
              borderRadius: 1,
              transform: `rotate(${rotate}deg)`,
              animation: `confettiFall ${dur}s cubic-bezier(0.3,0.7,0.4,1) ${delay}s forwards`,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes confettiFall {
          to {
            transform: translateY(220px) rotate(540deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
