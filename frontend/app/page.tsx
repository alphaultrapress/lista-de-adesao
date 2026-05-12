import Link from "next/link";
import { Brand, Footer } from "@/components/Brand";

const passos = [
  {
    titulo: "Cadastre-se como representante",
    descricao:
      "Apenas o representante da turma faz cadastro. Em menos de dois minutos sua sala está pronta na plataforma.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.25" />
        <path
          d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    titulo: "Receba o link da turma",
    descricao:
      "Geramos um link exclusivo e QR Code para você compartilhar com os colegas pelo WhatsApp.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path
          d="M10 14a3 3 0 0 0 4 0l4-4a3 3 0 1 0-4-4l-1 1"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          d="M14 10a3 3 0 0 0-4 0l-4 4a3 3 0 1 0 4 4l1-1"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    titulo: "Acompanhe as adesões",
    descricao:
      "Os colegas preenchem sem precisar criar conta. Você vê tudo em tempo real no painel.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path
          d="M3 17l5-5 4 4 8-8"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 8h6v6"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg">
      {/* Header tecnológico — preto translúcido */}
      <header className="fixed top-0 inset-x-0 z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Brand size="sm" variant="light" href="" />
          <nav className="flex items-center gap-8">
            <Link
              href="/login"
              className="hidden sm:inline text-[11px] tracking-premium-wide uppercase text-white/60 hover:text-white transition-colors duration-250"
            >
              Acesso do representante
            </Link>
            <Link
              href="/cadastro"
              className="text-[11px] tracking-premium-wide uppercase text-white border border-white/15 hover:border-white hover:bg-white/5 px-4 py-2 transition-all duration-250"
            >
              Cadastrar turma
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO cinematográfico */}
      <section className="relative pt-32 pb-32 md:pt-44 md:pb-40 overflow-hidden">
        {/* Layers de profundidade */}
        <div className="absolute inset-0 bg-grid-light pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[500px] glow-crimson opacity-90 pointer-events-none" />
        <div className="absolute top-20 right-[10%] w-[280px] h-[280px] glow-crimson-soft pointer-events-none animate-float" />
        <div className="absolute bottom-10 left-[8%] w-[220px] h-[220px] glow-crimson-soft pointer-events-none animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Eyebrow tech */}
          <div className="inline-flex fade-up">
            <span className="tech-eyebrow">
              <span className="dot" />
              Plataforma · Turmas de formatura
            </span>
          </div>

          {/* Heading cinematográfico */}
          <h1 className="mt-10 font-serif text-[44px] sm:text-6xl md:text-7xl lg:text-[88px] leading-[0.98] tracking-premium-tight text-text-primary fade-up fade-up-d1">
            Crie a lista oficial
            <br />
            <span className="italic font-light text-gray-500">
              da sua turma.
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="mt-10 max-w-xl mx-auto text-base md:text-lg text-text-secondary leading-relaxed fade-up fade-up-d2">
            Cadastre sua turma, gere um link exclusivo e compartilhe com os
            colegas. Acompanhe cada adesão em tempo real, no painel da Alpha.
          </p>

          {/* CTAs */}
          <div className="mt-14 flex flex-col sm:flex-row gap-3 justify-center items-center fade-up fade-up-d3">
            <Link href="/cadastro" className="btn-primary-tech group">
              <span>Sou representante da turma</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="transition-transform duration-450 ease-premium group-hover:translate-x-1"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link href="/login" className="btn-secondary-tech">
              Já tenho cadastro
            </Link>
          </div>

          {/* Nota discreta */}
          <p className="mt-16 text-[11px] tracking-premium-wide uppercase text-text-tertiary fade-up fade-up-d4 max-w-md mx-auto leading-relaxed">
            Recebeu um link da sua turma? Acesse-o diretamente —{" "}
            <span className="text-text-secondary">
              sem precisar criar conta
            </span>{" "}
            para preencher a adesão.
          </p>
        </div>

        {/* Status bar — toque tech */}
        <div className="relative mt-24 max-w-4xl mx-auto px-6 fade-up fade-up-d5">
          <div className="grid grid-cols-3 gap-px bg-line">
            {[
              { v: "100%", l: "Online em tempo real" },
              { v: "0+", l: "Turmas ativas" },
              { v: "·", l: "Lista oficial Alpha" },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-bg/80 backdrop-blur px-6 py-5 text-center"
              >
                <p className="font-serif text-2xl text-text-primary">{s.v}</p>
                <p className="mt-1 text-[10px] tracking-premium-widest uppercase text-text-tertiary">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona — cards tech glassmorphism */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] glow-crimson-soft pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="tech-eyebrow">
              <span className="dot" />
              Como funciona
            </span>
            <h2 className="mt-8 font-serif text-4xl md:text-5xl lg:text-6xl tracking-premium-tight text-text-primary leading-[1.02]">
              Um único representante.
              <br />
              <span className="italic font-light text-gray-500">
                A turma toda alinhada.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {passos.map((p, i) => (
              <article
                key={p.titulo}
                className="card-tech p-10 group"
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="text-text-tertiary group-hover:text-crimson transition-colors duration-450">
                    {p.icon}
                  </span>
                  <span className="font-serif text-2xl text-text-tertiary/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-serif text-xl text-text-primary mb-3 tracking-premium-snug">
                  {p.titulo}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {p.descricao}
                </p>
                <div className="mt-8 h-px bg-line group-hover:bg-line-strong transition-colors duration-450" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final — preto cinematográfico */}
      <section className="relative bg-ink-950 text-text-inverse py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-dark opacity-60 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] glow-crimson pointer-events-none" />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 bg-white/[0.03] backdrop-blur text-[10px] tracking-premium-widest uppercase text-white/60">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson shadow-[0_0_10px_rgba(110,20,20,0.8)]" />
            Pronto para começar
          </span>
          <h2 className="mt-8 font-serif text-4xl md:text-5xl lg:text-6xl tracking-premium-tight leading-[1.02]">
            Representar sua turma
            <br />
            <span className="italic font-light text-white/50">
              começa com um cadastro.
            </span>
          </h2>
          <p className="mt-6 text-white/60">
            Menos de dois minutos. Sem compromisso.
          </p>
          <Link
            href="/cadastro"
            className="group inline-flex items-center gap-3 mt-12 px-9 py-4 bg-white text-ink-950 hover:bg-bg-soft text-[11px] tracking-premium-wide uppercase transition-all duration-450 ease-premium"
          >
            Iniciar cadastro
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="transition-transform duration-450 ease-premium group-hover:translate-x-1"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
