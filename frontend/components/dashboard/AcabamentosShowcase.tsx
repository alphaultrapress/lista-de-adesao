import Image from "next/image";

type Acabamento = {
  nome: string;
  arquivo: string;
};

const acabamentos: Acabamento[] = [
  { nome: "Hot Stamping", arquivo: "Hot stamping.png" },
  { nome: "Acrílico Espelhado", arquivo: "Acrílico espelhado.png" },
  { nome: "Alto Relevo", arquivo: "ALTO RELEVO.png" },
  { nome: "Baixo Relevo", arquivo: "BAIXO RELEVO.png" },
  { nome: "Aplique 3V", arquivo: "Aplique 3V.png" },
  { nome: "Corte Especial", arquivo: "Corte especial.png" },
  { nome: "Medalha Latão Oval", arquivo: "Medalha Latão Oval.png" },
];

// Track duplicado garante loop infinito sem reset visível: a animação desliza
// exatamente -50% (= largura de UMA cópia), então o frame final é idêntico ao inicial.
const trilho = [...acabamentos, ...acabamentos];

export default function AcabamentosShowcase() {
  return (
    <section className="relative overflow-hidden bg-bg-ice py-14 md:py-16">
      <div className="absolute inset-0 bg-grid-tech bg-[length:48px_48px] opacity-40 pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-radial-crimson opacity-60 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-8 text-center md:mb-10">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Showcase Alpha
          </span>
          <h2 className="mt-6 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Acabamentos{" "}
            <span className="italic font-light text-gray-500">premium.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-text-secondary">
            Detalhes que transformam um convite comum em uma peça memorável.
            Experiência visual, textura e presença física.
          </p>
        </div>
      </div>

      <div className="acabamentos-viewport relative">
        <div className="acabamentos-track flex gap-5">
          {trilho.map((item, i) => (
            <article
              key={`${item.arquivo}-${i}`}
              className="acabamento-card group relative h-[310px] w-[260px] flex-shrink-0 overflow-hidden rounded-[12px] bg-ink-900 shadow-[0_18px_48px_-18px_rgba(0,0,0,0.35)] transition-shadow duration-500 ease-premium hover:shadow-[0_28px_70px_-18px_rgba(0,0,0,0.45)] md:h-[400px] md:w-[340px]"
            >
              <Image
                src={`/images/${item.arquivo}`}
                alt={item.nome}
                fill
                unoptimized
                sizes="(max-width: 768px) 260px, 340px"
                className="acabamento-img object-cover object-center transition-transform duration-700 ease-premium group-hover:scale-[1.03]"
                priority={i < 5}
                loading={i < 5 ? "eager" : "lazy"}
              />

              {/* Overlay leve apenas no rodapé — topo da imagem permanece limpo */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.20) 28%, rgba(0,0,0,0) 58%)",
                }}
              />

              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="mb-1.5 text-[9px] uppercase tracking-premium-widest text-white/55">
                  Acabamento
                </p>
                <h3 className="font-serif text-[20px] leading-tight tracking-premium-tight text-white md:text-[22px]">
                  {item.nome}
                </h3>
                <div className="mt-3 h-[1px] w-8 bg-white/40 transition-all duration-500 ease-premium group-hover:w-14" />
              </div>

              <div className="pointer-events-none absolute inset-0 rounded-[12px] ring-1 ring-inset ring-white/5" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
