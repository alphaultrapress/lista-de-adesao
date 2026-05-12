"use client";

import { useEffect, useState } from "react";
import Card from "../ui/Card";
import { supabase, Adesao } from "@/lib/supabase";

interface Props {
  slug: string;
  curso: string;
}

export default function AdesoesCard({ slug, curso }: Props) {
  const [list, setList] = useState<Pick<Adesao, "id" | "nome" | "criado_em">[]>(
    [],
  );
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, count } = await supabase
      .from("adesoes")
      .select("id, nome, criado_em", { count: "exact" })
      .eq("slug_origem", slug)
      .order("criado_em", { ascending: false })
      .limit(20);
    setList((data as any) || []);
    setCount(count || 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`adesoes-${slug}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "adesoes",
          filter: `slug_origem=eq.${slug}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <Card
      title="Adesões recebidas"
      subtitle="Atualizado em tempo real conforme os colegas preenchem."
    >
      <div className="flex items-baseline gap-3 mb-8">
        <span className="font-serif text-6xl text-text-primary tracking-premium-tight">
          {count}
        </span>
        <span className="text-[10px] tracking-premium-widest uppercase text-text-tertiary">
          adesões
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-text-tertiary">Carregando...</p>
      ) : list.length === 0 ? (
        <div className="border border-line px-4 py-10 text-center">
          <p className="text-sm text-text-secondary">
            Nenhum colega preencheu ainda.
          </p>
          <p className="mt-2 text-xs text-text-tertiary">
            Compartilhe seu link para começar.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((a) => (
            <li
              key={a.id}
              className="py-3.5 flex items-center justify-between text-sm"
            >
              <div>
                <p className="text-text-primary">{a.nome}</p>
                <p className="text-xs text-text-tertiary">{curso}</p>
              </div>
              <p className="text-xs text-text-tertiary tracking-premium-wide uppercase">
                {new Date(a.criado_em).toLocaleDateString("pt-BR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
