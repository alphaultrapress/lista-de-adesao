"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import TurmaDashboard, { ShareCard } from "@/components/dashboard/TurmaDashboard";
import DashboardTour from "@/components/dashboard/DashboardTour";
import { AUTH } from "@/components/auth/tokens";
import {
  signOutAndClearSession,
  supabase,
  Representative,
} from "@/lib/supabase";
import { useLoadingGate } from "@/components/ui/LoadingScreen";

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

  // Tela de carregamento premium; o gate a mantém viva até a saída terminar.
  const { mostrando: carregandoTela, tela } = useLoadingGate(loading || !representative);
  // O `!representative` fica aqui também porque é ele que estreita o tipo para
  // o resto da função — um booleano intermediário não faria isso.
  if (carregandoTela || !representative) return tela;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const adesaoUrl = `${appUrl}/adesao/${representative.slug}`;

  return (
    <main className="flex min-h-[100svh] min-w-0 flex-col" style={{ background: AUTH.offWhite }}>
      <header className="sticky top-0 z-30 flex min-h-[96px] items-start justify-between border-b border-black/[0.06] bg-[#F4F1EB] px-6 pb-4 pt-6 md:relative md:z-10 md:min-h-0 md:items-center md:border-0 md:bg-transparent md:px-10 md:py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[12px] transition-colors duration-200 hover:text-[#111210]"
          style={{ color: AUTH.textMuted }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden>
            <path
              d="M19 12H5M11 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Voltar ao início
        </Link>

        <span
          className="pointer-events-none absolute left-1/2 block -translate-x-1/2 overflow-hidden"
          style={{ top: 16, height: 60, width: 91 }}
        >
          <Image
            src="/logos/logo-dark.png"
            alt="Alpha Convites"
            width={91}
            height={60}
            priority
            className="h-full w-full"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </span>

        <button
          type="button"
          onClick={logout}
          className="text-[12px] transition-colors duration-200 hover:text-[#111210]"
          style={{ color: AUTH.textMuted }}
        >
          Sair
        </button>
      </header>

      <section className="mx-auto w-full min-w-0 max-w-[1180px] flex-1 px-4 py-8 sm:px-6 md:py-12">
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
          <section
            className="relative min-w-0 overflow-hidden rounded-[24px] p-7 text-white sm:p-9"
            style={{
              background: AUTH.panel,
              boxShadow: "0 24px 64px rgba(17,18,16,0.18)",
            }}
          >
            <span
              className="inline-flex items-center gap-2 text-[11px] font-medium uppercase"
              style={{ letterSpacing: "0.18em", color: "rgba(250,249,246,0.58)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#C41230]" />
              Espaço do representante
            </span>
            <h1
              className="mt-7 font-light"
              style={{
                fontSize: "clamp(32px, 4vw, 48px)",
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
              }}
            >
              Olá, {representative.name.split(" ")[0]}.
            </h1>
            <p className="mt-4 max-w-[46ch] break-words text-[14px] leading-[1.55]" style={{ color: "rgba(250,249,246,0.62)" }}>
              Acompanhe a lista da turma, compartilhe o acesso e veja a evolução
              até a meta inicial.
            </p>

            <div className="mt-8 grid min-w-0 gap-4 border-t border-white/10 pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase" style={{ letterSpacing: "0.14em", color: "rgba(250,249,246,0.42)" }}>
                  Turma
                </p>
                <p className="mt-2 break-words text-[15px] font-medium" style={{ color: AUTH.warmWhite }}>
                  {representative.course_name}
                </p>
                <p className="mt-1 break-words text-[13px]" style={{ color: "rgba(250,249,246,0.58)" }}>
                  {representative.institution_name}
                </p>
              </div>
              <p className="text-[13px] sm:text-right" style={{ color: "rgba(250,249,246,0.58)" }}>
                Formatura {representative.graduation_year}
              </p>
            </div>
          </section>

          <section
            data-dashboard-tour="share-access"
            className="min-w-0 rounded-[24px] border p-5 sm:p-6"
            style={{
              background: AUTH.warmWhite,
              borderColor: AUTH.border,
              boxShadow: "0 18px 44px rgba(17,18,16,0.08)",
            }}
          >
            <p className="text-[11px] font-medium uppercase" style={{ letterSpacing: "0.18em", color: AUTH.textMuted }}>
              Convide sua turma
            </p>
            <p className="mt-3 max-w-[35ch] text-[14px] leading-[1.5]" style={{ color: AUTH.textMuted }}>
              Compartilhe o link ou o QR Code para reunir adesões em um só lugar.
            </p>
            <div className="mt-5">
              <ShareCard
                representativeId={representative.id}
                url={adesaoUrl}
                nome={representative.name}
                curso={representative.course_name}
                instituicao={representative.institution_name}
              />
            </div>
          </section>
        </div>

        <div className="mt-5">
          <TurmaDashboard representative={representative} adesaoUrl={adesaoUrl} />
        </div>
      </section>
      <footer className="px-6 pb-6 text-center text-[11px] md:px-10" style={{ color: AUTH.textMuted }}>
        © 2026 Alpha Convites · Espaço do representante
      </footer>
      <DashboardTour representativeId={representative.id} />
    </main>
  );
}
