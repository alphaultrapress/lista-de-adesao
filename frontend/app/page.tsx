import Link from "next/link";
import { Brand, Footer } from "@/components/Brand";

const passos = [
  {
    titulo: "Cadastre-se como representante",
    descricao:
      "Apenas o representante da turma faz cadastro. Em menos de dois minutos sua sala está pronta.",
  },
  {
    titulo: "Receba o link da turma",
    descricao:
      "Geramos um link exclusivo e QR Code para você compartilhar com os colegas pelo WhatsApp.",
  },
  {
    titulo: "Acompanhe as adesões",
    descricao:
      "Os colegas preenchem sem precisar criar conta. Você vê tudo em tempo real no painel.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg">
      {/* Header escuro premium */}
      <header className="bg-ink">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Brand size="sm" variant="light" href="" />
          <Link
            href="/login"
            className="text-[11px] tracking-premium-wide uppercase text-white/70 hover:text-champagne transition-colors duration-250"
          >
            Acesso do representante
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-3xl mx-auto px-6 pt-28 md:pt-36 pb-24 text-center">
          <p className="text-[10px] tracking-premium-widest uppercase text-champagne-deep mb-8 fade-in">
            Lista de adesão · Turmas de formatura
          </p>

          <h1 className="font-serif text-5xl md:text-7xl tracking-premium-tight text-text-primary leading-[1.05] fade-in fade-in-delay-1">
            Crie a lista oficial
            <br />
            <span className="italic text-text-secondary">da sua turma.</span>
          </h1>

          <p className="mt-10 max-w-xl mx-auto text-text-secondary text-base md:text-[17px] leading-relaxed fade-in fade-in-delay-2">
            Cadastre sua turma, gere um link exclusivo e compartilhe com os
            colegas interessados nos convites de formatura Alpha.
          </p>

          <div className="mt-14 flex flex-col sm:flex-row gap-4 justify-center items-center fade-in fade-in-delay-3">
            <Link
              href="/cadastro"
              className="group inline-flex items-center gap-3 px-9 py-4 bg-ink text-text-inverse text-[11px] tracking-premium-wide uppercase hover:bg-ink-800 transition-all duration-350 ease-premium"
            >
              Sou representante da turma
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="transition-transform duration-350 ease-premium group-hover:translate-x-1"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-9 py-4 border border-line-strong text-[11px] tracking-premium-wide uppercase text-text-primary hover:border-ink hover:bg-black/[0.03] transition-all duration-350 ease-premium"
            >
              Já tenho cadastro
            </Link>
          </div>

          <p className="mt-16 text-[11px] tracking-premium-wide uppercase text-text-tertiary fade-in fade-in-delay-4 max-w-md mx-auto">
            Recebeu um link da sua turma? Acesse-o diretamente —{" "}
            <span className="text-text-secondary">
              não precisa criar conta
            </span>{" "}
            para preencher a adesão.
          </p>
        </div>
      </section>

      {/* Passos — fundo cinza suave */}
      <section className="bg-bg-soft border-y border-line">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-[10px] tracking-premium-widest uppercase text-champagne-deep mb-4">
              Como funciona
            </p>
            <h2 className="font-serif text-3xl md:text-4xl tracking-premium-tight text-text-primary">
              Um único representante.
              <br />
              <span className="italic text-text-secondary">
                A turma toda alinhada.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-line">
            {passos.map((p, i) => (
              <div
                key={p.titulo}
                className="bg-bg-warm p-10 transition-colors duration-350 ease-premium hover:bg-bg-ice"
              >
                <p className="font-serif text-3xl text-champagne mb-6">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-serif text-xl text-text-primary mb-3 tracking-premium-tight">
                  {p.titulo}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {p.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-text-primary tracking-premium-tight">
            Pronto para representar sua turma?
          </h2>
          <p className="mt-4 text-text-secondary">
            Cadastro em menos de dois minutos. Sem compromisso.
          </p>
          <Link
            href="/cadastro"
            className="inline-block mt-10 px-9 py-4 bg-ink text-text-inverse text-[11px] tracking-premium-wide uppercase hover:bg-ink-800 transition-colors duration-350"
          >
            Iniciar cadastro
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
