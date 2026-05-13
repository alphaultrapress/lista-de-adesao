import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";

const steps = [
  {
    title: "Crie o acesso oficial",
    description:
      "O representante cadastra a turma e recebe um ambiente exclusivo para iniciar a lista de adesão.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M7 8.5h10M7 12h7M7 15.5h4"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <path
          d="M5.5 3.5h13A1.5 1.5 0 0 1 20 5v14a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V5a1.5 1.5 0 0 1 1.5-1.5Z"
          stroke="currentColor"
          strokeWidth="1.25"
        />
      </svg>
    ),
  },
  {
    title: "Compartilhe o link da turma",
    description:
      "Cada colega acessa o formulário oficial sem criar conta, com uma experiência simples e confiável.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M9.5 14.5 14.5 9.5M10.5 7.5l1.2-1.2a4 4 0 0 1 5.7 5.7l-1.2 1.2M13.5 16.5l-1.2 1.2a4 4 0 0 1-5.7-5.7l1.2-1.2"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Monitore as adesões",
    description:
      "O painel organiza os registros em tempo real para apoiar a decisão da turma e o atendimento Alpha.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
        <path
          d="M4 18V6M4 18h16M8 15v-4M12 15V8M16 15v-6"
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
    <main className="page-canvas min-h-screen bg-bg">
      <PremiumHeader
        actions={[
          { href: "/login", label: "Login" },
          { href: "/cadastro", label: "Cadastrar", emphasis: true },
        ]}
      />

      <section id="inicio" className="hero-premium">
        <div className="hero-grid-layer" />
        <div className="hero-noise-layer cinematic-noise" />
        <div className="hero-light hero-light-main" />
        <div className="hero-light hero-light-side" />
        <div className="hero-line hero-line-a" />
        <div className="hero-line hero-line-b" />

        <div className="hero-content">
          <div className="hero-copy-block">
            <div className="fade-up">
              <span className="tech-eyebrow">
                <span className="dot" />
                Tecnologia premium para formaturas
              </span>
            </div>

            <h1 className="hero-title fade-up fade-up-d1">
              Crie a lista oficial
              <br />
              <span>da sua turma.</span>
            </h1>

            <p className="hero-description fade-up fade-up-d2">
              A Alpha Convites transforma a organização da turma em uma
              experiência digital precisa, elegante e monitorada em tempo real.
            </p>
          </div>

          <div className="hero-banner-wrap fade-up fade-up-d3">
            <div className="hero-banner-surface" aria-hidden>
              <div className="hero-banner-ambient" aria-hidden />
              <div className="hero-banner-vignette" aria-hidden />
            </div>

            <div className="hero-cta-panel">
              <span className="hero-cta-eyebrow">
                <svg
                  width="18"
                  height="10"
                  viewBox="0 0 18 10"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M1 5h2l1.5-3.5L7 8.5l2-7L11 9l1.5-4L14 5h3"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Gestão inteligente
              </span>

              <h2 className="hero-cta-title">
                Sua lista,
                <br />
                sua turma<span className="dot-crimson">.</span>
              </h2>

              <p className="hero-cta-text">
                Tudo que o representante precisa para organizar, acompanhar e
                entregar uma experiência impecável para toda a turma.
              </p>

              <div className="hero-cta-actions">
                <Link href="/cadastro" className="hero-btn-primary group">
                  <span>Sou representante</span>
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
                <Link href="/login" className="hero-btn-secondary group">
                  <span>Login</span>
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
            </div>

            <Image
              src="/images/Modelo-IA.png"
              alt="Formando segurando convite premium da Alpha"
              width={1600}
              height={1600}
              priority
              quality={100}
              sizes="(max-width: 900px) 92vw, 60vw"
              className="hero-banner-img"
            />
          </div>
        </div>
      </section>

      <section id="como-funciona" className="process-section">
        <div className="section-ambient" />
        <div className="section-heading scroll-reveal">
          <span className="tech-eyebrow">
            <span className="dot" />
            Como funciona
          </span>
          <h2>
            Fluxo simples.
            <br />
            <span>Experiência premium.</span>
          </h2>
          <p>
            Um sistema enxuto para coletar adesões, organizar informações e
            manter a turma alinhada sem ruído operacional.
          </p>
        </div>

        <div className="process-grid">
          {steps.map((step, index) => (
            <article key={step.title} className="process-card scroll-reveal">
              <div className="process-card-top">
                <span className="process-icon">{step.icon}</span>
                <span className="process-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-grid" />
        <div className="final-cta-light" />
        <div className="final-cta-inner scroll-reveal">
          <span className="tech-eyebrow dark">
            <span className="dot" />
            Pronto para iniciar
          </span>
          <h2>
            Sua turma com uma presença
            <br />
            <span>digital de alto padrão.</span>
          </h2>
          <p>
            Cadastre a turma, gere o link oficial e acompanhe as adesões com uma
            interface criada para parecer tão premium quanto a formatura.
          </p>
          <Link href="/cadastro" className="btn-primary-tech">
            <span className="relative z-10">Cadastrar turma</span>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
