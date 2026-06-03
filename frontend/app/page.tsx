"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import SocialProof from "@/components/SocialProof";
import GalleryCarousel from "@/components/GalleryCarousel";
import AcabamentosShowcase from "@/components/dashboard/AcabamentosShowcase";

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

export default function LandingPage() {
  return (
    <main className="page-canvas min-h-screen bg-[#0A0A0A] selection:bg-[#C41230] selection:text-white">
      <PremiumHeader
        actions={[
          { href: "/login", label: "Login" },
          { href: "/cadastro", label: "Cadastrar", emphasis: true },
        ]}
      />

      {/* HERO SECTION — vídeo autoplay/loop simples (sem scroll-scrubbing) */}
      <section
        className="relative w-full"
        style={{ height: "100vh", overflow: "hidden", background: "#0A0A0A" }}
      >
        <video
          src="/social-proof/hero-familia.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
          }}
        />
        {/* Overlay: mobile escurece mais (texto sobre foto clara);
            desktop mantém o degradê lateral original. */}
        <div
          className="pointer-events-none absolute inset-0 [background:linear-gradient(to_bottom,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.65)_45%,rgba(0,0,0,0.85)_100%)] md:[background:linear-gradient(to_right,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.3)_100%)]"
        />

        {/* Conteúdo do Hero — alinhado à esquerda.
            Mobile: padding lateral menor e largura total;
            md+: padding-left 80px e max-width 600px (desktop intacto). */}
        <div
          className="absolute inset-0 z-10 flex flex-col justify-center px-6 md:pl-20 md:pr-0 md:max-w-[600px]"
        >
          <div className="fade-up flex flex-col items-start text-left">
            <span
              className="inline-flex items-center gap-3 font-sans font-semibold uppercase"
              style={{
                fontSize: "10.5px",
                letterSpacing: "0.34em",
                marginBottom: "24px",
                padding: "8px 18px 8px 14px",
                color: "#FFFFFF",
                background:
                  "linear-gradient(135deg, rgba(196,18,48,0.18) 0%, rgba(196,18,48,0.06) 100%)",
                border: "1px solid rgba(232,69,95,0.55)",
                borderRadius: "999px",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow:
                  "0 0 0 1px rgba(232,69,95,0.12), 0 8px 24px rgba(196,18,48,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
                textShadow: "0 1px 10px rgba(0,0,0,0.7)",
              }}
            >
              {/* Diamante crimson com glow */}
              <span
                aria-hidden
                className="inline-block h-[5px] w-[5px] rotate-45"
                style={{
                  background:
                    "linear-gradient(135deg, #FF6B85 0%, #C41230 100%)",
                  boxShadow:
                    "0 0 8px rgba(232,69,95,0.8), 0 0 14px rgba(196,18,48,0.45)",
                }}
              />
              <span>Convites premium para formaturas</span>
            </span>

            <h1
              className="font-serif text-white leading-[1.08] md:leading-[1.05] tracking-tight font-semibold text-[clamp(34px,9vw,44px)] md:text-[clamp(48px,6vw,88px)] [text-shadow:0_2px_12px_rgba(0,0,0,0.55)] md:[text-shadow:none]"
            >
              Sua turma<br />
              merece um convite<br />
              <span className="relative inline-block italic font-semibold text-white align-baseline">
                {/* Brush stroke SVG — pincelada vermelha angular atrás do texto */}
                <svg
                  aria-hidden
                  viewBox="0 0 600 130"
                  preserveAspectRatio="none"
                  className="absolute pointer-events-none"
                  style={{
                    left: "-3%",
                    right: "-3%",
                    top: "-4%",
                    width: "106%",
                    height: "120%",
                    zIndex: 0,
                    filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.55))",
                  }}
                >
                  <defs>
                    <linearGradient id="brushGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2A2A2D" />
                      <stop offset="45%" stopColor="#54565B" />
                      <stop offset="100%" stopColor="#2A2A2D" />
                    </linearGradient>
                    <filter id="brushNoise">
                      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" />
                      <feDisplacementMap in="SourceGraphic" scale="3" />
                    </filter>
                  </defs>
                  {/* Pincelada principal — path angular irregular */}
                  <path
                    d="M 8 28 Q 50 18, 120 22 T 280 24 Q 360 20, 440 26 T 590 30 L 595 95 Q 520 102, 440 98 T 280 100 Q 180 104, 100 98 T 6 95 Z"
                    fill="url(#brushGrad)"
                    filter="url(#brushNoise)"
                  />
                  {/* Risco superior fino, simulando pincel arrastado */}
                  <path
                    d="M 12 24 Q 150 16, 300 20 T 588 26"
                    stroke="#54565B"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  className="relative px-2"
                  style={{
                    zIndex: 1,
                    textShadow:
                      "0 2px 12px rgba(0,0,0,0.55), 0 0 24px rgba(255,255,255,0.15)",
                  }}
                >
                  inesquecível.
                </span>
              </span>
            </h1>

            <p
              className="font-sans text-sm md:text-lg leading-relaxed max-w-full md:max-w-[420px] mt-4 text-white/85 md:text-[#aaa] [text-shadow:0_1px_8px_rgba(0,0,0,0.5)] md:[text-shadow:none]"
            >
             Crie a lista de interesse da sua turma, gere o link oficial e compartilhe com toda a turma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch sm:items-start justify-start w-full sm:w-auto mt-8">
              <Link href="/cadastro" className="group relative inline-flex items-center justify-center h-12 px-8 bg-[#0A0A0A] text-white font-sans text-[11px] uppercase tracking-[0.15em] font-semibold transition-colors duration-300 hover:bg-[#1A1A1A] border border-white/10 rounded-[2px]">
                <span>PRIMEIRO ACESSO &rarr;</span>
              </Link>
              <Link href="/login" className="group relative inline-flex items-center justify-center h-12 px-8 border border-white text-white font-sans text-[11px] uppercase tracking-[0.15em] font-semibold transition-colors duration-300 hover:bg-white hover:text-[#0A0A0A] rounded-[2px]">
                <span>JÁ TENHO CONTA &rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px',
          padding: '12px 24px',
          color: 'white',
          fontFamily: 'var(--font-inter), sans-serif',
          fontSize: '13px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap'
        }}>
          ⭐ <span className="font-semibold">5.0</span> <span className="text-white/40">·</span> <span className="text-[#A1A1A1] text-[11px] uppercase tracking-wider font-medium">+30.000 turmas atendidas</span>
        </div>
      </section>

      {/* NOSSA HISTÓRIA */}
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

      {/* COMO FUNCIONA */}
      <section className="py-24 md:py-32 bg-bg-soft relative overflow-hidden border-t border-[rgba(0,0,0,0.08)]">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20 md:mb-28 fade-up">
            <span className="inline-flex items-center gap-2 text-[#C41230] font-sans text-[11px] uppercase tracking-[0.15em] mb-6 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C41230]"></span>
              O PROCESSO
            </span>
            <h2 className="font-serif text-4xl md:text-5xl text-[#0A0A0A] font-semibold tracking-tight">
              Como funciona?
            </h2>
          </div>

          <div className="relative mb-28 fade-up fade-up-d1">
            {/* Linha conectora principal (passa no meio dos ícones) */}
            <div className="absolute top-[48px] left-[12%] right-[12%] hidden md:block z-0">
              <div className="absolute inset-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.1)] to-transparent"></div>
              {/* Ponto de luz animado percorrendo a linha */}
              <div 
                className="absolute top-[-0.5px] h-[2px] bg-gradient-to-r from-transparent via-[#C41230] to-transparent opacity-80"
                style={{
                  width: "40%",
                  animation: "moving-light 4s cubic-bezier(0.4, 0, 0.2, 1) infinite"
                }}
              ></div>
              <style>{`
                @keyframes moving-light {
                  0% { left: -40%; opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { left: 100%; opacity: 0; }
                }
              `}</style>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-8 relative z-10">
              {[
                { 
                  desc: "Compartilhe o link com sua turma.",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                  )
                },
                { 
                  desc: "Cada interessado preenche o formulário.",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  )
                },
                { 
                  desc: "Nossa equipe analisa a lista da turma.",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M10.5 7v4.5m0 0H14m-3.5 0H7" opacity="0.4" />
                    </svg>
                  )
                },
                { 
                  desc: "Entramos em contato com as condições.",
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-7 h-7">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M15 12a3 3 0 1 1-6 0" opacity="0.4" />
                    </svg>
                  )
                }
              ].map((step, i) => (
                <div key={i} className="group flex flex-col items-center text-center relative">
                  
                  {/* Container do Ícone com número integrado */}
                  <div className="relative mb-8">
                    {/* Glow de fundo */}
                    <div className="absolute inset-0 bg-[#C41230] rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-700"></div>
                    
                    {/* Círculo Principal do Ícone */}
                    <div className="w-24 h-24 rounded-full bg-white border border-[rgba(0,0,0,0.06)] shadow-[0_8px_24px_rgba(0,0,0,0.03)] flex items-center justify-center text-[#0A0A0A] relative z-10 transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(196,18,48,0.12)] group-hover:border-[rgba(196,18,48,0.2)]">
                      <div className="transform group-hover:scale-110 group-hover:text-[#C41230] transition-all duration-500">
                        {step.icon}
                      </div>
                    </div>

                    {/* Badge Elegante do Número */}
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center border-4 border-bg-soft z-20 shadow-sm transition-colors duration-500 group-hover:bg-[#C41230]">
                      <span className="font-serif text-[15px] italic font-light">0{i+1}</span>
                    </div>
                  </div>
                  
                  {/* Descrição */}
                  <p className="text-[16px] text-[#666666] leading-relaxed max-w-[220px] transition-colors duration-300 group-hover:text-[#0A0A0A] font-light">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-2xl mx-auto py-8 px-10 border-l-[3px] border-[#C41230] fade-up fade-up-d2 bg-[rgba(0,0,0,0.04)]">
            <p className="font-serif text-[22px] md:text-2xl text-[#0A0A0A] text-center leading-relaxed font-light">
             Quanto mais interessados a turma tiver, melhores podem ser as condições e os valores por  <span className="italic">convite.</span>
            </p>
          </div>
        </div>
      </section>

      {/* POR QUE ALPHA */}
      <section className="py-24 md:py-32 bg-[#FAFAFA] relative border-t border-[rgba(0,0,0,0.08)] overflow-hidden">
        {/* Grid de Fundo Tecnológico */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#0A0A0A 1px, transparent 1px), linear-gradient(90deg, #0A0A0A 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        ></div>
        
        {/* Glow Central Sutil no Fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#C41230] rounded-full blur-[140px] opacity-[0.04] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24 fade-up">
            {/* Tag elegante acima do título */}
            <span className="inline-flex items-center justify-center gap-2 px-4 py-1.5 border border-[rgba(0,0,0,0.1)] bg-white/80 backdrop-blur-sm text-[#0A0A0A] font-sans text-[10px] uppercase tracking-[0.2em] mb-8 font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[2px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C41230] animate-[pulse_2s_ease-in-out_infinite]"></span>
              DIFERENCIAIS ALPHA
            </span>
            
            <h2 className="font-serif text-4xl md:text-[52px] text-[#0A0A0A] font-light tracking-tight">
              Por que conhecer a <span className="text-[#C41230] italic font-medium">Alpha?</span>
            </h2>
            
            {/* Linha divisória minimalista */}
            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#C41230] to-transparent mx-auto mt-8 opacity-60"></div>
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
              <div key={i} className="group relative p-10 bg-white/70 backdrop-blur-md border border-[rgba(0,0,0,0.05)] shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-2 hover:shadow-[0_24px_48px_rgba(196,18,48,0.08)] hover:border-[rgba(196,18,48,0.2)] hover:bg-white rounded-[4px]">
                
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
                  <h3 className="font-sans text-[18px] md:text-[20px] font-medium text-[#0A0A0A] leading-snug tracking-tight group-hover:text-[#0A0A0A] transition-colors duration-500">
                    {title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SocialProof />
      <GalleryCarousel />
      <AcabamentosShowcase />
      <Footer />
    </main>
  );
}
