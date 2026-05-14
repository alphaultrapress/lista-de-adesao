import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Brand";
import PremiumHeader from "@/components/PremiumHeader";
import SocialProof from "@/components/SocialProof";
import AcabamentosShowcase from "@/components/dashboard/AcabamentosShowcase";

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
                Convites premium para formaturas
              </span>
            </div>

            <h1
              className="hero-title fade-up fade-up-d1"
              style={{ maxWidth: "18ch" }}
            >
              Sua turma merece um
              <br />
              <span style={{ whiteSpace: "normal" }}>
                convite inesquecível.
              </span>
            </h1>

            <p className="hero-description fade-up fade-up-d2">
              Há mais de 50 anos a Alpha transforma histórias em memórias.
              Representantes de turma criam aqui a lista oficial para receber
              propostas personalizadas, sem compromisso.
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
                Para representantes
              </span>

              <h2 className="hero-cta-title">
                Sua lista,
                <br />
                sua turma<span className="dot-crimson">.</span>
              </h2>

              <p className="hero-cta-text">
                Cadastre a turma, gere o link oficial e acompanhe quem
                demonstrou interesse — tudo em um ambiente premium e simples.
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

      <section className="relative overflow-hidden bg-bg-ice py-20 md:py-24">
        <div className="absolute inset-0 bg-grid-tech bg-[length:48px_48px] opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-6 text-center fade-up">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Nossa história
          </span>
          <h2 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Há mais de 50 anos{" "}
            <span className="italic font-light text-gray-500">
              transformando histórias em memórias.
            </span>
          </h2>
          <p className="mx-auto mt-7 max-w-2xl leading-relaxed text-text-secondary md:text-lg">
            A Alpha acompanha momentos especiais através de convites que unem
            tradição, sofisticação e acabamentos exclusivos.
          </p>

          <div
            aria-hidden
            className="mx-auto mt-12 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C9A961 50%, transparent 100%)",
            }}
          />

          <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4 md:gap-10">
            {[
              { value: "50+", label: "anos transformando histórias em memórias" },
              { value: "30+", label: "anos sob a segunda geração" },
              { value: "Brasil", label: "turmas atendidas em todo o país" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center">
                <dt className="font-serif text-4xl leading-none tracking-premium-tight text-text-primary md:text-6xl">
                  {item.value}
                </dt>
                <dd className="mt-3 max-w-[14rem] text-[11px] uppercase leading-relaxed tracking-premium-wide text-text-tertiary md:text-xs">
                  {item.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section
        id="como-funciona"
        className="relative mx-auto max-w-6xl px-6 py-20 md:py-24"
      >
        <div className="mb-14 text-center fade-up md:mb-16">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Simples e sem compromisso
          </span>
          <h2 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Como{" "}
            <span className="italic font-light text-gray-500">funciona?</span>
          </h2>
          <div
            aria-hidden
            className="mx-auto mt-8 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C9A961 50%, transparent 100%)",
            }}
          />
        </div>

        <ol className="relative mx-auto max-w-5xl">
          <div
            aria-hidden
            className="absolute left-7 top-7 bottom-7 w-px md:hidden"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, #C9A961 12%, #C9A961 88%, transparent 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute left-[10%] right-[10%] top-7 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C9A961 12%, #C9A961 88%, transparent 100%)",
            }}
          />

          <div className="grid gap-10 md:grid-cols-4 md:gap-6">
            {[
              "Compartilhe o link com sua turma",
              "Cada interessado preenche rapidamente",
              "Nossa equipe analisa o interesse da turma",
              "Entramos em contato com possibilidades e condições especiais",
            ].map((step, index) => (
              <li
                key={step}
                className="relative flex items-start gap-5 md:flex-col md:items-center md:gap-6 md:text-center"
              >
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line-strong bg-bg-white shadow-[0_4px_20px_rgba(10,10,10,0.04)]">
                  <span className="font-serif text-xl italic text-text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="pt-2 text-[15px] leading-relaxed text-text-secondary md:max-w-[14rem] md:pt-0 md:text-base">
                  {step}
                </p>
              </li>
            ))}
          </div>
        </ol>

        <div className="relative mx-auto mt-16 max-w-3xl border border-line bg-bg-ice px-7 py-6 md:mt-20 md:px-10 md:py-7">
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-10 w-px -translate-y-1/2"
            style={{ background: "#C9A961" }}
          />
          <div className="flex items-center gap-5">
            <span
              aria-hidden
              className="hidden h-2 w-2 rotate-45 shrink-0 md:inline-block"
              style={{ background: "#C9A961" }}
            />
            <p className="font-serif text-lg italic leading-relaxed text-text-primary md:text-xl">
              Turmas com maior número de interessados podem receber condições
              especiais e projetos personalizados.
            </p>
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
            <span className="italic font-light text-gray-500">Alpha?</span>
          </h2>
          <div
            aria-hidden
            className="mx-auto mt-8 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C9A961 50%, transparent 100%)",
            }}
          />
        </div>

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            "Mais de 50 anos de história",
            "Acabamentos premium e personalizados",
            "Turmas atendidas em todo o Brasil",
            "Convite online e soluções complementares",
            "Atendimento especializado para formandos",
            "Projetos com percepção de exclusividade",
          ].map((title, index) => (
            <li
              key={title}
              className="group relative border border-line bg-bg-white p-7 transition-all duration-450 ease-premium hover:border-line-strong"
            >
              <span
                aria-hidden
                className="absolute left-7 top-0 h-px w-8"
                style={{ background: "#C9A961" }}
              />
              <span className="block font-serif text-lg italic text-text-tertiary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-sans text-base leading-snug text-text-primary md:text-lg">
                {title}
              </h3>
            </li>
          ))}
        </ul>
      </section>

      <SocialProof />

      <AcabamentosShowcase />

      <Footer />
    </main>
  );
}
