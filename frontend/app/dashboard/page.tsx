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
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-text-tertiary tracking-premium-wide uppercase">
          Carregando seu painel
        </p>
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
    <main className="min-h-screen bg-bg">
      <header className="glass-dark sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Brand size="sm" variant="light" />
          <button
            onClick={logout}
            className="text-[11px] tracking-premium-wide uppercase text-white/60 hover:text-white transition-colors duration-250"
          >
            Sair
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-16 md:py-20 relative">
        <div className="absolute top-0 right-0 w-[400px] h-[300px] glow-crimson-soft pointer-events-none opacity-50" />

        <div className="relative mb-14">
          <span className="tech-eyebrow">
            <span className="dot" />
            Painel do representante
          </span>
          <h1 className="mt-7 font-serif text-4xl md:text-5xl tracking-premium-tight text-text-primary leading-[1.05]">
            Olá,{" "}
            <span className="italic font-light text-gray-500">
              {formando.nome.split(" ")[0]}.
            </span>
          </h1>
          <p className="mt-5 text-text-secondary">
            Turma de{" "}
            <span className="text-text-primary">{formando.curso}</span> ·{" "}
            <span className="text-text-primary">{formando.instituicao}</span> ·{" "}
            <span className="text-text-primary">{formando.semestre}</span>
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

        <div className="relative mt-14 bg-ink-950 text-text-inverse p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 overflow-hidden">
          <div className="absolute inset-0 bg-grid-dark opacity-50 pointer-events-none" />
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[400px] h-[300px] glow-crimson pointer-events-none" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/[0.03] text-[10px] tracking-premium-widest uppercase text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_10px_rgba(110,20,20,0.8)]" />
              Atendimento direto
            </span>
            <h3 className="mt-4 font-serif text-2xl md:text-3xl mb-2 tracking-premium-tight">
              Quer falar com um consultor?
            </h3>
            <p className="text-sm text-white/60 max-w-md">
              Tire dúvidas e receba uma proposta personalizada para a sua turma.
            </p>
          </div>
          <a href={waConsultor} target="_blank" rel="noreferrer" className="relative">
            <Button variant="light">Falar com um consultor</Button>
          </a>
        </div>
      </section>
      <Footer />
    </main>
  );
}
