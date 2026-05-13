"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Button from "@/components/ui/Button";
import LinkCard from "@/components/dashboard/LinkCard";
import AcabamentosShowcase from "@/components/dashboard/AcabamentosShowcase";
import AdesoesCard from "@/components/dashboard/AdesoesCard";
import {
  signOutAndClearSession,
  supabase,
  Representative,
} from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [representative, setRepresentative] =
    useState<Representative | null>(null);
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
        .from("representatives")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!data) {
        router.replace("/cadastro");
        return;
      }

      setRepresentative(data as Representative);
      setLoading(false);
    })();
  }, [router]);

  async function logout() {
    await signOutAndClearSession();
    router.replace("/login");
  }

  if (loading || !representative) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-text-tertiary tracking-premium-wide uppercase">
          Carregando seu painel
        </p>
      </main>
    );
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const adesaoUrl = `${appUrl}/adesao/${representative.slug}`;

  const waConsultor = `https://wa.me/?text=${encodeURIComponent(
    `Olá! Sou ${representative.name}, formando de ${representative.course_name} na ${representative.institution_name}. Quero saber mais sobre os convites Alpha.`,
  )}`;

  return (
    <main className="page-canvas min-h-screen bg-bg">
      <PremiumHeader onLogout={logout} compact />

      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-32 md:pb-20 md:pt-36">
        <div className="absolute right-0 top-0 h-[300px] w-[400px] glow-crimson-soft opacity-50 pointer-events-none" />

        <div className="relative mb-14 fade-up">
          <span className="tech-eyebrow">
            <span className="dot" />
            Painel do representante
          </span>
          <h1 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Olá,{" "}
            <span className="italic font-light text-gray-500">
              {representative.name.split(" ")[0]}.
            </span>
          </h1>
          <p className="mt-5 text-text-secondary">
            Turma de{" "}
            <span className="text-text-primary">
              {representative.course_name}
            </span>{" "}
            ·{" "}
            <span className="text-text-primary">
              {representative.institution_name}
            </span>{" "}
            ·{" "}
            <span className="text-text-primary">
              {representative.graduation_year}
            </span>
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <LinkCard
            url={adesaoUrl}
            nome={representative.name}
            curso={representative.course_name}
            instituicao={representative.institution_name}
          />
          <AdesoesCard
            representativeId={representative.id}
            curso={representative.course_name}
          />
        </div>
      </section>

      <AcabamentosShowcase />

      <section className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="cta-consultor relative flex flex-col items-start justify-between gap-8 overflow-hidden p-10 text-text-inverse md:flex-row md:items-center md:p-14">
          <div className="cta-grid pointer-events-none absolute inset-0" />
          <div className="cta-glow-tr pointer-events-none absolute inset-0" />
          <div className="cta-glow-bc pointer-events-none absolute inset-0" />
          <div className="cta-scanline pointer-events-none absolute inset-x-0 top-1/2" />
          <div className="cinematic-noise pointer-events-none absolute inset-0 opacity-20" />

          <div className="relative">
            <span className="tech-eyebrow dark">
              <span className="dot" />
              Atendimento direto
            </span>
            <h3 className="mb-2 mt-5 font-serif text-2xl tracking-premium-tight text-[#f5f5f5] md:text-3xl">
              Quer falar com um consultor?
            </h3>
            <p className="max-w-md text-sm text-[#b8b8b8]">
              Tire dúvidas e receba uma proposta personalizada para a sua turma.
            </p>
          </div>
          <a
            href={waConsultor}
            target="_blank"
            rel="noreferrer"
            className="cta-btn-wrap relative"
          >
            <Button variant="light">Falar com um consultor</Button>
          </a>
        </div>
      </section>
      <Footer />
    </main>
  );
}
