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
      "Geramos um link exclusivo e QR Code que você compartilha com os colegas pelo WhatsApp.",
  },
  {
    titulo: "Acompanhe as adesões",
    descricao:
      "Os colegas preenchem sem precisar criar conta. Você vê tudo em tempo real no painel.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Hero */}
      <section className="relative">
        <div className="max-w-3xl mx-auto px-6 pt-20 md:pt-28 pb-20 text-center">
          <div className="flex justify-center mb-14 fade-in">
            <Brand size="lg" href="" />
          </div>

          <p className="text-[11px] tracking-premium-wide uppercase text-premium-gold mb-6 fade-in">
            Lista de adesão · turmas de formatura
          </p>

          <h1 className="font-serif text-4xl md:text-6xl tracking-premium-tight text-premium-white leading-[1.1] fade-in">
            Crie a lista oficial
            <br />
            <span className="text-premium-light2 italic">da sua turma.</span>
          </h1>

          <p className="mt-8 max-w-xl mx-auto text-premium-light1 text-sm md:text-base leading-relaxed fade-in">
            Cadastre sua turma, gere um link exclusivo e compartilhe com os
            colegas interessados nos convites de formatura Alpha.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center fade-in">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#F5F5F0] text-[#0A0A0A] text-xs tracking-premium-wide uppercase hover:bg-premium-gold transition-colors duration-300"
            >
              Sou representante da turma
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
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
              className="inline-flex items-center px-8 py-4 border border-white/10 text-xs tracking-premium-wide uppercase text-premium-light2 hover:border-premium-gold hover:text-premium-gold transition-colors"
            >
              Já tenho cadastro
            </Link>
          </div>

          <p className="mt-10 text-[11px] tracking-premium-wide uppercase text-premium-mid2 fade-in">
            Recebeu um link da sua turma? Acesse-o diretamente — não precisa
            criar conta para preencher a adesão.
          </p>
        </div>
      </section>

      {/* Passos */}
      <section className="border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-[11px] tracking-premium-wide uppercase text-premium-gold mb-3">
              Como funciona
            </p>
            <h2 className="font-serif text-2xl md:text-3xl tracking-premium-tight text-premium-white">
              Um único representante. A turma toda alinhada.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/10">
            {passos.map((p, i) => (
              <div
                key={p.titulo}
                className="bg-[#0A0A0A] p-10 hover:bg-[#141414] transition-colors duration-300"
              >
                <p className="text-[10px] tracking-premium-wide uppercase text-premium-gold mb-4">
                  0{i + 1}
                </p>
                <h3 className="font-serif text-xl text-premium-white mb-3 tracking-premium-tight">
                  {p.titulo}
                </h3>
                <p className="text-sm text-premium-light1 leading-relaxed">
                  {p.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="font-serif text-2xl md:text-3xl text-premium-white tracking-premium-tight">
            Pronto para representar sua turma?
          </h2>
          <p className="mt-4 text-sm text-premium-light1">
            Cadastro em menos de dois minutos. Sem compromisso.
          </p>
          <Link
            href="/cadastro"
            className="inline-block mt-8 px-8 py-4 border border-white/10 text-xs tracking-premium-wide uppercase text-premium-white hover:border-premium-gold hover:text-premium-gold transition-colors"
          >
            Iniciar cadastro do representante
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
