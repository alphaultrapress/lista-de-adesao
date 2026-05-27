"use client";

import { useEffect, useState } from "react";
import Card from "../ui/Card";
import { supabase, Student, META_CONVITES } from "@/lib/supabase";

interface Props {
  representativeId: string;
  curso: string;
}

type StudentRow = Pick<
  Student,
  "id" | "full_name" | "created_at" | "qtd_convites"
>;

export default function AdesoesCard({ representativeId, curso }: Props) {
  const [list, setList] = useState<StudentRow[]>([]);
  const [count, setCount] = useState(0);
  const [totalConvites, setTotalConvites] = useState(0);
  const [loading, setLoading] = useState(true);
  const [displayConvites, setDisplayConvites] = useState(0);

  useEffect(() => {
    if (totalConvites === 0) {
      setDisplayConvites(0);
      return;
    }
    let startTimestamp: number | null = null;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayConvites(Math.floor(easeProgress * totalConvites));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [totalConvites]);

  async function load() {
    setLoading(true);
    const { data, count } = await supabase
      .from("students")
      .select("id, full_name, created_at, qtd_convites", { count: "exact" })
      .eq("representative_id", representativeId)
      .order("created_at", { ascending: false })
      .limit(20);
    const rows = (data as StudentRow[]) || [];
    setList(rows);
    setCount(count || 0);

    const { data: allConvites } = await supabase
      .from("students")
      .select("qtd_convites")
      .eq("representative_id", representativeId);
    const total = (allConvites || []).reduce(
      (sum, r: any) => sum + (r.qtd_convites || 0),
      0,
    );
    setTotalConvites(total);
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
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [representativeId]);

  const pct = Math.min(100, Math.round((totalConvites / META_CONVITES) * 100));
  const metaAtingida = totalConvites >= META_CONVITES;

  return (
    <Card
      title="Adesões recebidas"
      subtitle="Atualizado em tempo real conforme os colegas preenchem."
    >
      <div className="mb-6 flex items-baseline gap-3">
        <span className="font-serif text-6xl tracking-premium-tight text-text-primary">
          {displayConvites}
        </span>
        <span className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
          convites · {count} {count === 1 ? "adesão" : "adesões"}
        </span>
      </div>

      {/* Barra de progresso até a meta */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-premium-widest text-text-tertiary">
          <span>Meta de {META_CONVITES} convites</span>
          <span className="text-[#0a7d3a]">{pct}%</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-line/40">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg,#0a7d3a 0%,#13b85a 100%)",
            }}
          />
        </div>
        {metaAtingida ? (
          <p className="mt-3 text-xs text-[#0a7d3a]">
            Meta atingida! Um consultor entrará em contato em breve.
          </p>
        ) : (
          <p className="mt-3 text-xs text-text-tertiary">
            Faltam {META_CONVITES - totalConvites}{" "}
            {META_CONVITES - totalConvites === 1 ? "convite" : "convites"} para
            ativar o atendimento comercial.
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-text-tertiary">Carregando...</p>
      ) : list.length === 0 ? (
        <div className="border border-line bg-white/60 px-4 py-10 text-center">
          <p className="text-sm text-text-secondary">
            Nenhum colega preencheu ainda.
          </p>
          <p className="mt-2 text-xs text-text-tertiary">
            Compartilhe seu link para começar.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((student) => (
            <li
              key={student.id}
              className="flex items-center justify-between gap-4 py-3.5 text-sm"
            >
              <div>
                <p className="text-text-primary">{student.full_name}</p>
                <p className="text-xs text-text-tertiary">{curso}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="font-medium text-text-primary">
                  {student.qtd_convites}{" "}
                  <span className="text-text-tertiary">
                    {student.qtd_convites === 1 ? "convite" : "convites"}
                  </span>
                </span>
                <span className="uppercase tracking-premium-wide text-text-tertiary">
                  {new Date(student.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
