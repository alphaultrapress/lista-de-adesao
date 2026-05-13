"use client";

import { useEffect, useState } from "react";
import Card from "../ui/Card";
import { supabase, Student } from "@/lib/supabase";

interface Props {
  representativeId: string;
  curso: string;
}

export default function AdesoesCard({ representativeId, curso }: Props) {
  const [list, setList] = useState<
    Pick<Student, "id" | "full_name" | "created_at">[]
  >([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, count } = await supabase
      .from("students")
      .select("id, full_name, created_at", { count: "exact" })
      .eq("representative_id", representativeId)
      .order("created_at", { ascending: false })
      .limit(20);
    setList((data as any) || []);
    setCount(count || 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`students-${representativeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
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

  return (
    <Card
      title="Adesões recebidas"
      subtitle="Atualizado em tempo real conforme os colegas preenchem."
    >
      <div className="mb-8 flex items-baseline gap-3">
        <span className="font-serif text-6xl tracking-premium-tight text-text-primary">
          {count}
        </span>
        <span className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
          adesões
        </span>
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
              <p className="text-xs uppercase tracking-premium-wide text-text-tertiary">
                {new Date(student.created_at).toLocaleDateString("pt-BR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
