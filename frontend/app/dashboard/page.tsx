"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand, Footer } from "@/components/Brand";
import Button from "@/components/ui/Button";
import LinkCard from "@/components/dashboard/LinkCard";
import PricingTable from "@/components/dashboard/PricingTable";
import AdesoesCard from "@/components/dashboard/AdesoesCard";
import { supabase, Formando } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [formando, setFormando] = useState<Formando | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        router.replace("/login");
        return;
      }
      const userId = sess.session.user.id;
      const { data } = await supabase
        .from("formandos")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (!data) {
        router.replace("/cadastro");
        return;
      }
      setFormando(data as Formando);
      setLoading(false);
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading || !formando) {
    return (
      <main className="min-h-screen bg-premium-black flex items-center justify-center">
        <p className="text-sm text-premium-light1">Carregando seu painel...</p>
      </main>
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const adesaoUrl = `${appUrl}/adesao/${formando.slug}`;

  const waConsultor = `https://wa.me/?text=${encodeURIComponent(
    `Olá! Sou ${formando.nome}, formando de ${formando.curso} na ${formando.instituicao}. Quero saber mais sobre os convites Alpha.`,
  )}`;

  return (
    <main className="min-h-screen bg-premium-black">
      <header className="border-b-[0.5px] border-premium-dark3 bg-premium-black/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Brand size="sm" />
          <button
            onClick={logout}
            className="text-[11px] tracking-premium-wide uppercase text-premium-light1 hover:text-premium-gold transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-12">
          <p className="text-[11px] tracking-premium-wide uppercase text-premium-gold mb-3">
            Painel do representante
          </p>
          <h1 className="font-serif text-3xl md:text-4xl tracking-premium-tight">
            Olá, {formando.nome.split(" ")[0]}.
          </h1>
          <p className="mt-3 text-sm text-premium-light1">
            Turma de{" "}
            <span className="text-premium-white">{formando.curso}</span> ·{" "}
            <span className="text-premium-white">{formando.instituicao}</span> ·{" "}
            <span className="text-premium-white">{formando.semestre}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <LinkCard
            url={adesaoUrl}
            nome={formando.nome}
            curso={formando.curso}
            instituicao={formando.instituicao}
          />
          <AdesoesCard slug={formando.slug} curso={formando.curso} />
          <div className="lg:col-span-2">
            <PricingTable />
          </div>
        </div>

        <div className="mt-12 hairline border-premium-dark3 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-xl text-premium-white mb-2">
              Quer falar diretamente com um consultor?
            </h3>
            <p className="text-sm text-premium-light1">
              Tire dúvidas e receba uma proposta personalizada para a sua turma.
            </p>
          </div>
          <a href={waConsultor} target="_blank" rel="noreferrer">
            <Button variant="gold">Falar com um consultor</Button>
          </a>
        </div>
      </section>
      <Footer />
    </main>
  );
}
