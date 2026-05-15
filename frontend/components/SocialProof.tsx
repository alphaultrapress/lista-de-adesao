import { SOCIAL } from "@/lib/social";
import TestimonialsCarousel from "./TestimonialsCarousel";

// =====================================================================
// PROVA SOCIAL — vídeos reais (autoplay, mute, loop, sem controles)
// ---------------------------------------------------------------------
// 6 reels verticais (9:16) servidos de /public/Videos/1.mp4 .. 6.mp4,
// exibidos em carrossel premium contínuo (.reels-carousel em globals.css).
// Os depoimentos reais (prints) ficam em <TestimonialsCarousel />.
// =====================================================================

const reels = [
  "/Videos/1.mp4",
  "/Videos/2.mp4",
  "/Videos/3.mp4",
  "/Videos/4.mp4",
  "/Videos/5.mp4",
  "/Videos/6.mp4",
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
    <section className="relative bg-bg-soft py-14 md:py-20">
      <div className="absolute inset-0 bg-grid-tech bg-[length:48px_48px] opacity-25 pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mb-10 text-center fade-up md:mb-12">
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

        {/* Carrossel premium de reels verticais — desktop: trilho automático contínuo
            (pausa no hover, destaca o vídeo sob o cursor e apaga os demais);
            mobile: scroll horizontal natural com snap. Degradê nas laterais. */}
        <div className="reels-carousel" aria-label="Vídeos de turmas reais">
          <div className="reels-track">
            {[...reels, ...reels].map((src, i) => {
              const isClone = i >= reels.length;
              return (
                <div
                  className={`reel-card${isClone ? " reel-card-clone" : ""}`}
                  key={`${src}-${i}`}
                  aria-hidden={isClone}
                >
                  <AutoVideo src={src} preload="metadata" className="reel-video" />
                  <div className="reel-card-shade" aria-hidden />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 mb-10 text-center fade-up md:mt-16 md:mb-12">
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

        <TestimonialsCarousel />

        {SOCIAL.instagram && (
          <div
            className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl"
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
