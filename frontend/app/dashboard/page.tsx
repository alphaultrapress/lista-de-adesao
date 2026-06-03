"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import TurmaDashboard, { ShareCard } from "@/components/dashboard/TurmaDashboard";
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

  return (
    <main className="page-canvas min-h-screen bg-bg">
      <PremiumHeader
        onLogout={logout}
        compact
        centeredBrand
        brandSize="lg"
      />

      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-32 md:pb-20 md:pt-36">
        <div className="absolute right-0 top-0 h-[300px] w-[400px] glow-crimson-soft opacity-50 pointer-events-none" />

        <div className="relative mb-14 flex flex-col gap-8 fade-up lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="tech-eyebrow">
              <span className="dot" />
              Representante da turma
            </span>
            <h1 className="mt-5 font-serif text-2xl leading-[1.1] tracking-premium-tight text-text-primary md:text-3xl">
              Olá,{" "}
              <span className="italic font-light text-gray-500">
                {representative.name.split(" ")[0]}.
              </span>
            </h1>
            <p className="mt-4 text-[13px] leading-relaxed text-text-tertiary">
              <span className="font-medium text-text-secondary">
                {representative.course_name}
              </span>
              <span className="mx-1.5 text-text-tertiary/60">·</span>
              {representative.institution_name}
              <span className="mx-1.5 text-text-tertiary/60">·</span>
              {representative.graduation_year}
            </p>
          </div>

          {/* Compartilhar acesso — faixa compacta no topo, perto do header */}
          <div className="w-full shrink-0 lg:w-auto lg:min-w-[330px] lg:max-w-[380px]">
            <ShareCard
              url={adesaoUrl}
              nome={representative.name}
              curso={representative.course_name}
              instituicao={representative.institution_name}
            />
          </div>
        </div>

        <TurmaDashboard representative={representative} adesaoUrl={adesaoUrl} />
      </section>
      <Footer />
    </main>
  );
}
