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

const classes = [
  {
    course: "Medicina 2027.2",
    detail: "86 adesões registradas",
  },
  {
    course: "Direito 2026.2",
    detail: "42 adesões confirmadas",
  },
  {
    course: "Arquitetura 2028.1",
    detail: "73 formulários enviados",
  },
];

const indicators = [
  { value: "100%", label: "Sincronização em tempo real" },
  { value: "01", label: "Representante central" },
  { value: "24/7", label: "Link ativo para turma" },
];

export default function LandingPage() {
  return (
    <main className="page-canvas min-h-screen bg-bg">
      <PremiumHeader
        actions={[
          { href: "/login", label: "Login representante" },
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
              Crie a
              <br />
              lista oficial
              <br />
              <span>da sua turma.</span>
            </h1>

            <p className="hero-description fade-up fade-up-d2">
              A Alpha Convites transforma a organização da turma em uma
              experiência digital precisa, elegante e monitorada em tempo real,
              feita para representantes que precisam de clareza e presença.
            </p>

            <div className="hero-actions fade-up fade-up-d3">
              <Link href="/cadastro" className="btn-primary-tech group">
                <span className="relative z-10">Sou representante da turma</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="relative z-10 transition-transform duration-450 ease-premium group-hover:translate-x-1"
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

            <p className="hero-note fade-up fade-up-d4">
              Recebeu um link da turma? Acesse diretamente o link oficial
              enviado pelo representante.
            </p>
          </div>

          <div className="hero-mockup-wrap fade-up fade-up-d3">
            <div className="representative-panel">
              <div className="panel-chrome">
                <span />
                <span />
                <span />
              </div>

              <div className="panel-header">
                <div>
                  <p className="panel-kicker">Painel do representante</p>
                  <h2>Monitoramento em tempo real</h2>
                </div>
                <div className="live-status">
                  <span />
                  Ao vivo
                </div>
              </div>

              <div className="panel-list">
                {classes.map((item) => (
                  <div key={item.course} className="panel-row">
                    <div>
                      <p>{item.course}</p>
                      <span>{item.detail}</span>
                    </div>
                    <svg viewBox="0 0 56 20" fill="none" aria-hidden="true">
                      <path
                        d="M1 14C8 14 8 6 15 6s7 9 14 9 8-12 14-12 6 8 12 8"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                ))}
              </div>

              <div className="panel-indicators">
                {indicators.map((item) => (
                  <div key={item.label}>
                    <p>{item.value}</p>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
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
