import { SOCIAL } from "@/lib/social";

// =====================================================================
// PROVA SOCIAL — vídeos reais (autoplay, mute, loop, sem controles)
// ---------------------------------------------------------------------
// Vídeos servidos diretamente de /public/Videos:
//   - /Videos/1.mp4  → vídeo horizontal (banner cinemático)
//   - /Videos/2.mp4  → reel vertical
//   - /Videos/3.mp4  → reel vertical
//   - /Videos/4.mp4  → reel vertical
//
// Para trocar os depoimentos placeholder, edite o array `testimonials`.
// =====================================================================

const reels = ["/Videos/2.mp4", "/Videos/3.mp4", "/Videos/4.mp4"];

type Testimonial = {
  quote: string;
  author: string;
  context: string;
  institution: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "A experiência com a Alpha foi impecável do começo ao fim. Cada detalhe do convite reforçou o quanto esse momento era único para a nossa turma.",
    author: "Mariana Lopes",
    context: "Medicina · Turma 2025",
    institution: "UEL — Universidade Estadual de Londrina",
  },
  {
    quote:
      "Os acabamentos surpreenderam todo mundo. Recebemos elogios de familiares e professores — virou parte da memória da nossa formatura.",
    author: "Gabriel Henrique",
    context: "Medicina · Turma 2024",
    institution: "PUCPR — Pontifícia Universidade Católica do Paraná",
  },
  {
    quote:
      "A Alpha conseguiu transformar a identidade da nossa turma em um convite elegante, emocionante e cheio de significado.",
    author: "Isabela Martins",
    context: "Medicina · Turma 2025",
    institution: "UP — Universidade Positivo",
  },
  {
    quote:
      "Desde o atendimento até a entrega, sentimos cuidado em cada etapa. O convite ficou à altura de tudo que vivemos na faculdade.",
    author: "Rafael Moreira",
    context: "Medicina · Turma 2024",
    institution: "UEM — Universidade Estadual de Maringá",
  },
];

type AutoVideoProps = {
  src: string;
  className?: string;
  preload?: "metadata" | "auto" | "none";
};

function AutoVideo({ src, className = "", preload = "metadata" }: AutoVideoProps) {
  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload={preload}
      disablePictureInPicture
      disableRemotePlayback
      controlsList="nodownload noremoteplayback nofullscreen noplaybackrate"
      tabIndex={-1}
      aria-hidden
      className={`pointer-events-none select-none ${className}`}
    >
      Seu navegador não suporta vídeos.
    </video>
  );
}

export default function SocialProof() {
  return (
    <section className="relative bg-bg-soft py-20 md:py-24">
      <div className="absolute inset-0 bg-grid-tech bg-[length:48px_48px] opacity-25 pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center fade-up md:mb-16">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Turmas reais
          </span>
          <h2 className="mt-7 font-serif text-4xl leading-[1.05] tracking-premium-tight text-text-primary md:text-5xl">
            Histórias que viraram{" "}
            <span className="italic font-light text-gray-500">memórias.</span>
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

        {/* Reels verticais (2.mp4, 3.mp4, 4.mp4) — desktop em linha, mobile em scroll horizontal */}
        <div className="-mx-6 px-6 md:mx-0 md:px-0">
          <ul
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0"
            style={{ scrollbarWidth: "none" }}
          >
            {reels.map((src) => (
              <li
                key={src}
                className="group relative w-[68%] shrink-0 snap-center rounded-xl shadow-[0_18px_50px_-18px_rgba(10,10,10,0.28)] transition-[transform,box-shadow] duration-[350ms] ease-premium hover:scale-[1.03] hover:shadow-[0_28px_70px_-18px_rgba(10,10,10,0.34)] active:scale-[1.02] md:w-auto"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(218,185,105,0.85) 0%, rgba(165,130,70,0.45) 35%, rgba(255,230,160,0.75) 60%, rgba(120,88,35,0.55) 100%)",
                  padding: "1.5px",
                }}
              >
                <div className="relative overflow-hidden rounded-[10px] bg-ink">
                  <div className="relative w-full" style={{ aspectRatio: "9 / 16" }}>
                    <AutoVideo
                      src={src}
                      preload="metadata"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-100 transition-opacity duration-[350ms] ease-premium group-hover:opacity-30 group-active:opacity-40"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 100%)",
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Vídeo horizontal (1.mp4) — centralizado, largura contida para não poluir */}
        <div className="mt-10 flex justify-center md:mt-14">
          <div
            className="group relative w-full max-w-3xl rounded-xl shadow-[0_22px_60px_-18px_rgba(10,10,10,0.32)] transition-[transform,box-shadow] duration-[350ms] ease-premium hover:scale-[1.025] hover:shadow-[0_32px_80px_-18px_rgba(10,10,10,0.4)] active:scale-[1.015]"
            style={{
              background:
                "linear-gradient(135deg, rgba(218,185,105,0.85) 0%, rgba(165,130,70,0.45) 35%, rgba(255,230,160,0.75) 60%, rgba(120,88,35,0.55) 100%)",
              padding: "1.5px",
            }}
          >
            <div className="relative overflow-hidden rounded-[10px] bg-ink">
              <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                <AutoVideo
                  src="/Videos/1.mp4"
                  preload="auto"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-100 transition-opacity duration-[350ms] ease-premium group-hover:opacity-25 group-active:opacity-40"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 100%)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 mb-12 text-center fade-up md:mt-24 md:mb-14">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Depoimentos
          </span>
          <h2 className="mt-7 font-serif text-3xl leading-[1.1] tracking-premium-tight text-text-primary md:text-4xl">
            O que os formandos dizem sobre a{" "}
            <span className="italic font-light text-gray-500">Alpha.</span>
          </h2>
          <div
            aria-hidden
            className="mx-auto mt-7 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #C9A961 50%, transparent 100%)",
            }}
          />
          <p className="mx-auto mt-7 max-w-xl leading-relaxed text-text-secondary">
            Histórias reais de turmas que viveram a experiência de transformar
            seus convites em memórias.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          {testimonials.map((t, i) => (
            <blockquote
              key={i}
              className="relative border border-line bg-bg-white p-7 md:p-8"
            >
              <span
                aria-hidden
                className="absolute left-7 top-0 h-px w-8"
                style={{ background: "#C9A961" }}
              />
              <span
                aria-hidden
                className="font-serif text-5xl leading-none text-gray-300"
              >
                &ldquo;
              </span>
              <p className="mt-1 font-serif text-lg italic leading-relaxed text-text-primary md:text-xl">
                {t.quote}
              </p>
              <footer className="mt-6 space-y-1 text-[10.5px] uppercase leading-relaxed tracking-premium-wide text-text-tertiary md:text-[11px]">
                <div>
                  <span className="text-text-secondary">{t.author}</span>
                  <span className="mx-2 text-text-tertiary/60">·</span>
                  <span>{t.context}</span>
                </div>
                <div className="text-text-tertiary/85">{t.institution}</div>
              </footer>
            </blockquote>
          ))}
        </div>

        {SOCIAL.instagram && (
          <div
            className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, #FFFFFF 0%, #F7F4EF 100%)",
              border: "1px solid rgba(194,157,88,0.22)",
              boxShadow: "0 24px 70px -20px rgba(10,10,10,0.10)",
            }}
          >
            <div className="grid items-center gap-7 p-7 md:grid-cols-[1fr_auto] md:gap-10 md:p-9">
              <div className="flex items-center gap-5">
                <span
                  aria-hidden
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-bg-ice"
                  style={{
                    border: "1px solid rgba(194,157,88,0.35)",
                  }}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-ink"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                  </svg>
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
                    Instagram oficial
                  </p>
                  <p className="mt-1 font-serif text-2xl italic text-text-primary md:text-3xl">
                    @{SOCIAL.instagramHandle}
                  </p>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                    Veja modelos reais, acabamentos premium e bastidores das
                    turmas.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <a
                  href={SOCIAL.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-2 bg-ink px-5 py-3 text-xs uppercase tracking-premium-wide text-text-inverse transition-all duration-[350ms] ease-premium hover:bg-ink-700"
                  style={{
                    border: "1px solid rgba(194,157,88,0.35)",
                  }}
                >
                  <span>Conhecer Instagram</span>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="transition-transform duration-[350ms] ease-premium group-hover:translate-x-0.5"
                  >
                    <path
                      d="M7 17L17 7M9 7h8v8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>

                {SOCIAL.modelos && (
                  <a
                    href={SOCIAL.modelos}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center gap-2 bg-transparent px-5 py-3 text-xs uppercase tracking-premium-wide text-text-primary transition-all duration-[350ms] ease-premium hover:bg-ink hover:text-text-inverse"
                    style={{
                      border: "1px solid rgba(194,157,88,0.45)",
                    }}
                  >
                    <span>Ver modelos</span>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="transition-transform duration-[350ms] ease-premium group-hover:translate-x-0.5"
                    >
                      <path
                        d="M7 17L17 7M9 7h8v8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {SOCIAL.tiktok && (
              <div
                className="px-7 py-3.5 md:px-9"
                style={{
                  borderTop: "1px solid rgba(194,157,88,0.18)",
                }}
              >
                <a
                  href={SOCIAL.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 text-text-tertiary transition-colors duration-[350ms] ease-premium hover:text-text-primary"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1Z" />
                  </svg>
                  <span className="text-[10px] uppercase tracking-premium-wide">
                    Também estamos no TikTok · @{SOCIAL.instagramHandle}
                  </span>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="transition-transform duration-[350ms] ease-premium group-hover:translate-x-0.5"
                  >
                    <path
                      d="M7 17L17 7M9 7h8v8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
