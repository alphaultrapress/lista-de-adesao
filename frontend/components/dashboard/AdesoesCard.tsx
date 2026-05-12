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
      title="Adesões da sua turma"
      subtitle="Atualizado em tempo real conforme os colegas preenchem."
    >
      <div className="flex items-baseline gap-3 mb-6">
        <span className="font-serif text-5xl text-premium-gold">{count}</span>
        <span className="text-xs tracking-premium-wide uppercase text-premium-light1">
          adesões recebidas
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-premium-mid2">Carregando...</p>
      ) : list.length === 0 ? (
        <div className="hairline border-premium-dark3 px-4 py-8 text-center">
          <p className="text-sm text-premium-light1">
            Nenhum colega preencheu ainda. Compartilhe seu link para começar.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-premium-dark3">
          {list.map((a) => (
            <li
              key={a.id}
              className="py-3 flex items-center justify-between text-sm"
            >
              <div>
                <p className="text-premium-white">{a.nome}</p>
                <p className="text-xs text-premium-mid2">{curso}</p>
              </div>
              <p className="text-xs text-premium-light1">
                {new Date(a.criado_em).toLocaleDateString("pt-BR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
