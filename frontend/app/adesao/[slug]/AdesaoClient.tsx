"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PhoneInput from "@/components/forms/PhoneInput";
import AcabamentosShowcase from "@/components/dashboard/AcabamentosShowcase";
import SocialProof from "@/components/SocialProof";
import GalleryCarousel from "@/components/GalleryCarousel";
import { SOCIAL } from "@/lib/social";
import { supabase, PublicRepresentative } from "@/lib/supabase";
import { isValidPhoneBr, onlyDigits } from "@/lib/cpf";

function AnimatedCounter({ end, suffix = "", prefix = "" }: { end: number, suffix?: string, prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let start = 0;
          const duration = 2000;
          const increment = end / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

export default function AdesaoClient({ slug }: { slug: string }) {
  const [turma, setTurma] = useState<PublicRepresentative | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nome: "",
    whatsapp: "",
    email: "",
    qtd_convites: "1",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [topError, setTopError] = useState<string | undefined>();

  useEffect(() => {
    if (!slug) return;
    (async () => {
      let representative: PublicRepresentative | null = null;

      const { data: rpcData } = await supabase.rpc(
        "get_representative_by_slug",
        { p_slug: slug },
      );
      const rpcRepresentative = Array.isArray(rpcData) ? rpcData[0] : rpcData;

      if (rpcRepresentative) {
        representative = rpcRepresentative as PublicRepresentative;
      } else {
        const { data } = await supabase
          .from("representatives")
          .select("id, name, course_name, institution_name, graduation_year, slug")
          .eq("slug", slug)
          .maybeSingle();

        if (data) {
          representative = data as PublicRepresentative;
        }
      }

      if (!representative) {
        const { data: legacy } = await supabase
          .from("formandos")
          .select("id, nome, curso, instituicao, semestre, slug")
          .eq("slug", slug)
          .maybeSingle();

        if (legacy) {
          representative = {
            id: legacy.id,
            name: legacy.nome,
            course_name: legacy.curso,
            institution_name: legacy.instituicao,
            graduation_year: legacy.semestre,
            slug: legacy.slug,
          };
        }
      }

      if (!representative) {
        setNotFound(true);
      } else {
        setTurma(representative);
      }
      setLoading(false);
    })();
  }, [slug]);

  function set<K extends keyof typeof form>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  // Nome sempre em MAIÚSCULAS.
  function setUpper<K extends keyof typeof form>(key: K, val: string) {
    set(key, val.toUpperCase());
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Informe seu nome completo.";
    if (!isValidPhoneBr(form.whatsapp)) e.whatsapp = "Celular inválido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "E-mail inválido.";
    }
    const qtd = parseInt(form.qtd_convites, 10);
    if (!qtd || qtd < 1) {
      e.qtd_convites = "Informe uma quantidade válida.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setTopError(undefined);
    if (!validate() || !turma) return;
    setSubmitting(true);
    try {
      const qtdConvites = Math.max(1, parseInt(form.qtd_convites, 10) || 1);
      const { error } = await supabase.from("students").insert({
        representative_id: turma.id,
        full_name: form.nome.trim(),
        phone: onlyDigits(form.whatsapp),
        email: form.email.trim().toLowerCase(),
        qtd_convites: qtdConvites,
      });

      if (error?.code === "23505") {
        setErrors((e) => ({
          ...e,
          email: "Este e-mail já foi cadastrado para esta turma.",
        }));
        return;
      }

      if (error?.code === "42P01") {
        const { error: legacyError } = await supabase.from("adesoes").insert({
          slug_origem: slug,
          nome: form.nome.trim(),
          whatsapp: onlyDigits(form.whatsapp),
          email: form.email.trim().toLowerCase(),
          qtd_luxo: 0,
          qtd_simples: 0,
          qtd_convites: qtdConvites,
          tem_fotos: "nao_sei",
          observacoes: null,
        });
        if (legacyError) throw legacyError;
      } else if (error) {
        throw error;
      }

      // Dispara verificação de meta (fire-and-forget — não bloqueia UX)
      fetch("/api/notify-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ representative_id: turma.id }),
      }).catch(() => {});

      setSuccess(true);
    } catch (err: any) {
      setTopError(
        err?.message ||
          "Não foi possível enviar seu interesse. Tente novamente em instantes.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-[#0A0A0A] tracking-premium-wide uppercase">
          Carregando
        </p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex flex-col">
        <PremiumHeader compact centeredBrand brandSize="lg" brandHref="" />
        <section className="relative flex flex-1 items-center justify-center px-6 pb-20 pt-32">
          <div className="absolute left-1/2 top-1/2 h-[340px] w-[560px] -translate-x-1/2 -translate-y-1/2 glow-crimson-soft pointer-events-none" />
          <div className="relative max-w-md text-center fade-up">
            <p className="mb-4 text-[10px] uppercase tracking-premium-widest text-wine">
              Link inválido
            </p>
            <h1 className="font-serif text-4xl tracking-premium-tight text-text-primary">
              Turma não encontrada
            </h1>
            <p className="mt-5 leading-relaxed text-[#3A3A3A]">
              Verifique o link recebido ou peça ao representante da sua turma
              para enviá-lo novamente.
            </p>
          </div>
        </section>
        <Footer minimal />
      </main>
    );
  }

  if (success) {
    return (
      <main className="page-canvas min-h-screen bg-bg flex flex-col">
        <PremiumHeader compact centeredBrand brandSize="lg" brandHref="" />
        <section className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pb-20 pt-32">
          <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 h-[420px] w-[680px] -translate-x-1/2 -translate-y-1/2 glow-crimson-soft pointer-events-none" />
          <div className="relative max-w-2xl text-center fade-up">
            <div className="relative mx-auto mb-10 h-20 w-20">
              <div className="absolute inset-0 border border-[#00ff7f]/60 bg-[#00ff7f] shadow-[0_0_24px_rgba(0,255,127,0.35)]" />
              <div className="absolute inset-0 flex items-center justify-center text-ink">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12l4 4L19 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="absolute -inset-3 border border-[#00ff7f]/25 shadow-[0_0_44px_rgba(0,255,127,0.18)] animate-glow" />
            </div>
            <span className="tech-eyebrow">
              <span className="dot" />
              Interesse registrado
            </span>
            <div className="mt-7 flex flex-col items-center justify-center gap-5 md:flex-row md:gap-8">
              <h1 className="font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
                Recebemos seu
                <br />
                <span className="italic font-light text-[#C41230]">interesse.</span>
              </h1>
              <Image
                src="/logos/logo-dark.png"
                alt="Alpha Convites"
                width={420}
                height={140}
                priority
                className="h-auto w-[120px] md:w-[150px]"
              />
            </div>
            <p className="mt-6 leading-relaxed text-[#3A3A3A]">
              Nossa equipe entrará em contato em breve para apresentar as
              possibilidades de convites para a sua turma, sem compromisso.
            </p>
          </div>
        </section>
        <Footer minimal />
      </main>
    );
  }

  return (
    <main className="page-canvas min-h-screen bg-bg">
      <PremiumHeader compact centeredBrand brandSize="lg" brandHref="" />

      <section className="relative flex flex-col items-center justify-center min-h-[100vh] px-6 pb-24 pt-36 md:pt-48 overflow-hidden">
        {/* Background Hero Image with cinematic fade-in + slow zoom */}
        <div
          className="absolute inset-0 z-0 opacity-0 animate-[heroReveal_1.8s_cubic-bezier(0.22,0.61,0.36,1)_forwards]"
          style={{ animationDelay: '0.15s' }}
        >
          <Image
            src="/images/hero.png"
            alt="Convite Premium"
            fill
            className="object-cover scale-105 animate-[heroZoom_18s_ease-out_forwards]"
            priority
          />

          {/* Layer 1 — strong cream/white overlay for legibility on light theme */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(250,247,242,0.82) 0%, rgba(250,247,242,0.7) 35%, rgba(250,247,242,0.8) 70%, rgba(250,247,242,0.95) 100%)",
            }}
          />

          {/* Layer 2 — central soft halo to ground the typography (cinematic spotlight inverso) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(250,247,242,0.55) 0%, rgba(250,247,242,0.15) 70%, transparent 100%)",
            }}
          />

          {/* Layer 3 — subtle warm gold tint */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(212,175,110,0.25) 0%, transparent 70%)",
            }}
          />

          {/* Layer 4 — bottom fade into the page background */}
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-b from-transparent to-bg pointer-events-none" />
        </div>

        {/* Floating luxury particles */}
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
          {[
            { l: "12%", t: "22%", d: "0s", s: "3px" },
            { l: "78%", t: "18%", d: "1.4s", s: "2px" },
            { l: "22%", t: "68%", d: "2.6s", s: "2px" },
            { l: "85%", t: "62%", d: "0.7s", s: "3px" },
            { l: "55%", t: "12%", d: "3.2s", s: "2px" },
            { l: "42%", t: "78%", d: "1.9s", s: "3px" },
          ].map((p, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: p.l,
                top: p.t,
                width: p.s,
                height: p.s,
                background: "radial-gradient(circle, rgba(212,175,110,0.9) 0%, rgba(212,175,110,0) 70%)",
                boxShadow: "0 0 8px rgba(212,175,110,0.6)",
                animation: `heroParticle 7s ease-in-out ${p.d} infinite`,
              }}
            />
          ))}
        </div>

        <style jsx>{`
          @keyframes heroReveal {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes heroZoom {
            from { transform: scale(1.08); }
            to { transform: scale(1.0); }
          }
          @keyframes heroParticle {
            0%, 100% { opacity: 0; transform: translateY(0) scale(0.8); }
            50% { opacity: 1; transform: translateY(-12px) scale(1); }
          }
          @keyframes shimmerLine {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }
        `}</style>

        <div className="relative z-10 mb-16 w-full max-w-3xl text-center fade-up">

          {/* Eyebrow with refined gold accent */}
          <span
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full backdrop-blur-md"
            style={{
              background: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(212,175,110,0.5)",
              boxShadow: "0 6px 24px rgba(20,15,10,0.1), inset 0 0 0 1px rgba(255,255,255,0.6)",
            }}
          >
            <span
              className="inline-block h-1 w-1 rotate-45"
              style={{
                background: "linear-gradient(135deg, #D4AF6E 0%, #B8923E 100%)",
                boxShadow: "0 0 6px rgba(212,175,110,0.6)",
              }}
            />
            <span
              className="font-sans text-[10px] uppercase font-semibold text-[#1A1410]"
              style={{ letterSpacing: "0.28em" }}
            >
              Lista de interesse da turma
            </span>
          </span>

          {/* Cinematic headline */}
          <h1
            className="mt-10 font-serif font-normal text-balance"
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4.75rem)",
              lineHeight: "1.02",
              letterSpacing: "-0.025em",
              color: "#0A0805",
              textShadow:
                "0 2px 0 rgba(255,253,248,0.95), 0 -1px 0 rgba(255,253,248,0.9), 1px 0 0 rgba(255,253,248,0.9), -1px 0 0 rgba(255,253,248,0.9), 0 6px 24px rgba(255,253,248,0.8), 0 12px 40px rgba(20,15,10,0.12)",
            }}
          >
            A história da sua turma merece ser{" "}
            <span
              className="italic"
              style={{
                color: "#2A2A2D",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                textShadow:
                  "0 2px 0 rgba(255,253,248,0.95), 0 -1px 0 rgba(255,253,248,0.9), 1px 0 0 rgba(255,253,248,0.9), -1px 0 0 rgba(255,253,248,0.9), 0 6px 24px rgba(255,253,248,0.85), 0 10px 32px rgba(42,42,45,0.18)",
              }}
            >
              eternizada.
            </span>
          </h1>

          {/* Gold + crimson shimmering divider */}
          <div
            aria-hidden
            className="mx-auto mt-10 flex items-center justify-center gap-3"
          >
            <span
              className="h-px w-16 md:w-24"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(212,175,110,0.7) 100%)",
              }}
            />
            <span
              className="inline-block h-1.5 w-1.5 rotate-45"
              style={{
                background: "linear-gradient(135deg, #D4AF6E 0%, #C41230 100%)",
                boxShadow: "0 0 12px rgba(196,18,48,0.4)",
                animation: "shimmerLine 3s ease-in-out infinite",
              }}
            />
            <span
              className="h-px w-16 md:w-24"
              style={{
                background:
                  "linear-gradient(90deg, rgba(212,175,110,0.7) 0%, transparent 100%)",
              }}
            />
          </div>

          {/* Editorial plaque — turma + instituição com hierarquia única e refinada */}
          <div className="mt-12 flex flex-col items-center">

            {/* Linha decorativa superior com ornamento central */}
            <div aria-hidden className="flex items-center gap-3 mb-5 opacity-80">
              <span
                className="h-px w-10"
                style={{ background: "linear-gradient(90deg, transparent 0%, #B8923E 100%)" }}
              />
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1 L9.5 6.5 L15 8 L9.5 9.5 L8 15 L6.5 9.5 L1 8 L6.5 6.5 Z"
                  fill="#B8923E"
                  fillOpacity="0.85"
                />
              </svg>
              <span
                className="h-px w-10"
                style={{ background: "linear-gradient(90deg, #B8923E 0%, transparent 100%)" }}
              />
            </div>

            {/* Eyebrow minúsculo */}
            <span
              className="font-sans font-semibold uppercase mb-3"
              style={{
                fontSize: "9.5px",
                letterSpacing: "0.42em",
                color: "#8B6B3A",
                textShadow: "0 1px 0 rgba(255,253,248,0.95), 0 2px 8px rgba(255,253,248,0.8)",
              }}
            >
              Apresenta-se
            </span>

            {/* Course name — protagonista editorial */}
            <h2
              className="font-serif italic"
              style={{
                fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)",
                lineHeight: "1.05",
                fontWeight: 400,
                color: "#8E0A22",
                letterSpacing: "-0.01em",
                textShadow:
                  "0 1px 0 rgba(255,253,248,0.95), 0 -1px 0 rgba(255,253,248,0.85), 1px 0 0 rgba(255,253,248,0.85), -1px 0 0 rgba(255,253,248,0.85), 0 6px 20px rgba(255,253,248,0.7)",
              }}
            >
              Turma de {turma?.course_name}
            </h2>

            {/* Instituição · ano — tipografia editorial em linha única */}
            <div
              className="mt-4 flex items-center gap-3 font-sans font-semibold uppercase"
              style={{
                fontSize: "10px",
                letterSpacing: "0.38em",
                color: "#1A1410",
                textShadow: "0 1px 0 rgba(255,253,248,0.95), 0 2px 10px rgba(255,253,248,0.85)",
              }}
            >
              <span>{turma?.institution_name}</span>
              <span
                aria-hidden
                className="inline-block h-1 w-1 rotate-45"
                style={{
                  background: "linear-gradient(135deg, #D4AF6E 0%, #8E0A22 100%)",
                }}
              />
              <span>{turma?.graduation_year}</span>
            </div>
          </div>

          {/* Description — editorial pura, sem caixa, com halo forte */}
          <p
            className="mx-auto mt-12 max-w-[520px] font-serif md:text-[17px]"
            style={{
              color: "#1A1410",
              fontWeight: 400,
              lineHeight: "1.75",
              letterSpacing: "0.005em",
              textShadow:
                "0 1px 0 rgba(255,253,248,0.95), 0 -1px 0 rgba(255,253,248,0.9), 1px 0 0 rgba(255,253,248,0.9), -1px 0 0 rgba(255,253,248,0.9), 0 4px 16px rgba(255,253,248,0.9), 0 8px 28px rgba(255,253,248,0.7)",
            }}
          >
            Cada conquista merece ser celebrada com um convite à altura desse momento. Descubra modelos exclusivos, acabamentos sofisticados e infinitas possibilidades de personalização para criar uma lembrança que será guardada para sempre.
          </p>

          {/* CTA único — destaque máximo, matte black com brilho dourado */}
          <div className="mt-12 flex justify-center">
            <a
              href="#interesse"
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden px-12 py-[18px] text-[12px] uppercase font-semibold text-white transition-all duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-[2px]"
              style={{
                letterSpacing: "0.26em",
                background:
                  "linear-gradient(135deg, #1A1410 0%, #0A0805 100%)",
                border: "1px solid rgba(212,175,110,0.4)",
                borderRadius: "3px",
                boxShadow:
                  "0 14px 40px rgba(20,15,10,0.4), 0 4px 12px rgba(20,15,10,0.2), inset 0 1px 0 rgba(212,175,110,0.15)",
              }}
            >
              {/* Gold shimmer sweep on hover */}
              <span
                aria-hidden
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(120deg, transparent 30%, rgba(212,175,110,0.22) 50%, transparent 70%)",
                }}
              />
              {/* Subtle gold underline accent */}
              <span
                aria-hidden
                className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-0 group-hover:w-[60%] transition-all duration-700 ease-out pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, #D4AF6E 50%, transparent 100%)",
                }}
              />
              <span className="relative">Quero demonstrar interesse</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="relative transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:translate-y-1"
              >
                <path
                  d="M12 5v14M6 13l6 6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          {/* Trust pills */}
          <ul className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-3 text-[10.5px] uppercase font-medium text-[#2A1F12] md:flex md:flex-wrap md:justify-center md:gap-x-7">
            {[
              "Modelos exclusivos",
              "Acabamentos premium",
              "Atendimento especializado",
              "+50 anos de tradição",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center justify-center gap-2"
                style={{ letterSpacing: "0.22em" }}
              >
                <span
                  aria-hidden
                  className="inline-block h-1 w-1 rotate-45"
                  style={{
                    background: "linear-gradient(135deg, #D4AF6E 0%, #C41230 100%)",
                    boxShadow: "0 0 6px rgba(212,175,110,0.5)",
                  }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </section>

      {/* ============================================================
          FORMULÁRIO REPLICADO — logo após o hero, captura rápida
          ============================================================ */}
      <section className="relative mx-auto max-w-2xl px-6 pb-16 pt-8 md:pt-12">
        <div className="mb-8 text-center fade-up">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Seu contato
          </span>
          <h2 className="mt-6 font-serif text-3xl leading-[1.1] tracking-premium-tight text-text-primary md:text-4xl">
            Vamos conversar sobre a{" "}
            <span className="italic font-light text-[#C41230]">
              sua formatura.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#3A3A3A]">
            Preencha seus dados e descubra as possibilidades que a Alpha preparou para a sua turma. É rápido, sem compromisso e nossa equipe entrará em contato pelo WhatsApp para apresentar opções, modelos e acabamentos.
          </p>
        </div>

        <form
          id="interesse"
          onSubmit={handleSubmit}
          className="relative card-hover space-y-6 p-6 md:p-9 scroll-mt-28 overflow-hidden rounded-2xl border border-line/50"
          noValidate
        >
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply">
            <Image src="/images/form-bg.png" alt="Background Texture" fill className="object-cover" />
          </div>
          <div className="relative z-10 space-y-6">
            <Input
              label="Seu nome"
              name="nome"
              value={form.nome}
              onChange={(e) => setUpper("nome", e.target.value)}
              error={errors.nome}
              required
            />
            <div className="grid gap-6 md:grid-cols-2">
              <PhoneInput
                label="Seu WhatsApp"
                value={form.whatsapp}
                onChange={(v) => set("whatsapp", v)}
                error={errors.whatsapp}
                required
              />
              <Input
                label="Seu e-mail"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                error={errors.email}
                required
              />
            </div>
            <Input
              label="Quantidade de convites"
              name="qtd_convites"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.qtd_convites}
              onChange={(e) =>
                set("qtd_convites", e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              hint="Quantidade aproximada de convites. Você pode ajustar depois com a equipe."
              error={errors.qtd_convites}
              required
            />
            {topError && (
              <div className="border border-wine/30 bg-wine/5 px-4 py-3 text-sm text-wine">
                {topError}
              </div>
            )}
            <Button type="submit" loading={submitting} fullWidth>
              {submitting ? "Enviando" : "Quero demonstrar interesse"}
            </Button>
            <p className="text-center text-xs leading-relaxed text-[#3A3A3A]">
              Sem compromisso · Gratuito · Seus dados são tratados com
              confidencialidade pela Alpha Convites.
            </p>
          </div>
        </form>
      </section>

      {/* NOSSA HISTÓRIA — bloco preto idêntico à landing (+30 mil / +50 anos / +30 anos) */}
      <section className="py-24 md:py-32 bg-[#0A0A0A] text-white relative border-t border-[rgba(255,255,255,0.08)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 text-center fade-up items-start">
            {[
              { end: 30, prefix: "+", suffix: "mil", label: "TURMAS ATENDIDAS" },
              { end: 50, prefix: "+", suffix: "anos", label: "DE HISTÓRIA" },
              { end: 30, prefix: "+", suffix: "anos", label: "COM A 2ª GERAÇÃO" },
            ].map((stat, i) => (
              <div key={i} className={`flex flex-col items-center justify-start py-8 ${i !== 2 ? 'md:border-r md:border-[rgba(255,255,255,0.1)]' : ''}`}>
                <h3
                  className="font-serif text-white leading-none flex items-baseline gap-2 md:gap-3 whitespace-nowrap"
                  style={{ fontSize: "clamp(64px, 8vw, 120px)" }}
                >
                  <AnimatedCounter end={stat.end} prefix={stat.prefix} />
                  <span
                    className="font-serif italic font-light text-white/70"
                    style={{ fontSize: "clamp(20px, 2vw, 28px)", letterSpacing: "0.01em" }}
                  >
                    {stat.suffix}
                  </span>
                </h3>
                <div className="w-[40px] h-[2px] bg-[#C41230] mt-5 mb-4"></div>
                <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-[#6B6B6B] font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-20 md:py-24">
        <div className="mb-14 text-center fade-up">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Diferenciais Alpha
          </span>
          <h2 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Por que conhecer a{" "}
            <span className="italic font-light text-[#C41230]">Alpha?</span>
          </h2>
          <div
            aria-hidden
            className="mx-auto mt-8 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C41230 50%, transparent 100%)",
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 fade-up fade-up-d1">
          {[
            "Mais de 50 anos de história",
            "Acabamentos premium e personalizados",
            "Turmas atendidas em todo o Brasil",
            "Convite online e soluções complementares",
            "Atendimento especializado para formandos",
            "Projetos com percepção de exclusividade",
          ].map((title, i) => (
            <div key={i} className="group relative p-10 bg-bg-white/70 backdrop-blur-md border border-[rgba(0,0,0,0.05)] shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-2 hover:shadow-[0_24px_48px_rgba(196,18,48,0.08)] hover:border-[rgba(196,18,48,0.2)] hover:bg-bg-white rounded-[4px]">

              {/* Linha Tecnológica Animada (Topo) */}
              <div className="absolute top-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#C41230] to-[#ff4d6a] transition-all duration-700 ease-out group-hover:w-full"></div>

              {/* Efeito Glow Interno */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[rgba(196,18,48,0.03)] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

              {/* Número Grande (Watermark no fundo) */}
              <div className="absolute bottom-2 right-4 font-serif text-[90px] leading-[0.8] text-[#0A0A0A] opacity-[0.02] italic font-light group-hover:opacity-[0.05] group-hover:text-[#C41230] transition-all duration-700 pointer-events-none transform group-hover:scale-105">
                0{i+1}
              </div>

              <div className="relative z-10">
                {/* Número Reduzido Elegante */}
                <div className="mb-6 flex items-center gap-4">
                  <span className="font-serif text-[26px] text-[#C41230] italic font-light leading-none">0{i+1}</span>
                  <div className="h-[1px] w-8 bg-[#C41230]/30 group-hover:w-16 group-hover:bg-[#C41230]/60 transition-all duration-700 ease-out"></div>
                </div>

                {/* Título do Diferencial */}
                <h3 className="font-sans text-[18px] md:text-[20px] font-medium text-[#0A0A0A] leading-snug tracking-tight transition-colors duration-500">
                  {title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      <SocialProof />
      <GalleryCarousel />

      <section className="relative mx-auto max-w-2xl px-6 pb-20 pt-20 md:pt-24">
        <div className="mb-10 text-center fade-up">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Seu contato
          </span>
          <h2 className="mt-7 font-serif text-3xl leading-[1.1] tracking-premium-tight text-text-primary md:text-4xl">
            Vamos conversar sobre a{" "}
            <span className="italic font-light text-[#C41230]">
              sua formatura.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#3A3A3A]">
            Preencha seus dados e descubra as possibilidades que a Alpha preparou para a sua turma. É rápido, sem compromisso e nossa equipe entrará em contato pelo WhatsApp para apresentar opções, modelos e acabamentos.
          </p>
        </div>

        <form
          id="interesse-final"
          onSubmit={handleSubmit}
          className="relative card-hover space-y-6 p-6 md:p-9 scroll-mt-28 overflow-hidden rounded-2xl border border-line/50"
          noValidate
        >
          {/* Form Background Texture */}
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-multiply">
            <Image src="/images/form-bg.png" alt="Background Texture" fill className="object-cover" />
          </div>
          <div className="relative z-10 space-y-6">
          <Input
            label="Seu nome"
            name="nome"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            error={errors.nome}
            required
          />

          <div className="grid gap-6 md:grid-cols-2">
            <PhoneInput
              label="Seu WhatsApp"
              value={form.whatsapp}
              onChange={(v) => set("whatsapp", v)}
              error={errors.whatsapp}
              required
            />
            <Input
              label="Seu e-mail"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              required
            />
          </div>

          <Input
            label="Quantos convites pretende adquirir?"
            name="qtd_convites"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.qtd_convites}
            onChange={(e) =>
              set("qtd_convites", e.target.value.replace(/\D/g, "").slice(0, 2))
            }
            hint="Quantidade aproximada de convites. Você pode ajustar depois com a equipe."
            error={errors.qtd_convites}
            required
          />

          {topError && (
            <div className="border border-wine/30 bg-wine/5 px-4 py-3 text-sm text-wine">
              {topError}
            </div>
          )}

          <Button type="submit" loading={submitting} fullWidth>
            {submitting ? "Enviando" : "Quero demonstrar interesse"}
          </Button>

          <p className="text-center text-xs leading-relaxed text-[#3A3A3A]">
            Sem compromisso · Gratuito · Seus dados são tratados com
            confidencialidade pela Alpha Convites.
          </p>
          </div>
        </form>

        <p className="mx-auto mt-6 max-w-md text-center text-[11px] uppercase tracking-premium-wide text-[#0A0A0A]">
          Turma de {turma?.course_name} · {turma?.institution_name} ·{" "}
          {turma?.graduation_year}
        </p>
      </section>
      <AcabamentosShowcase />

      <Footer minimal />
    </main>
  );
}
