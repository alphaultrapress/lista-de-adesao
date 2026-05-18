"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { SOCIAL } from "@/lib/social";
import TestimonialsCarousel from "./TestimonialsCarousel";

// =====================================================================
// PROVA SOCIAL — vídeos reais (pausados; o formando dá play)
// ---------------------------------------------------------------------
// 6 reels verticais (9:16) servidos de /public/Videos/1.mp4 .. 6.mp4.
// Os vídeos NÃO tocam sozinhos: o formando clica no play para iniciar
// (com som). Ao dar play o card cresce e os demais escurecem (foco).
// Setas laterais navegam; trocar de vídeo pausa o que estava tocando.
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

function ReelsCarousel() {
  // Índice do card no centro do palco (controla a navegação por setas).
  const [active, setActive] = useState(0);
  // Índice do vídeo tocando agora (null = nenhum). Só um por vez.
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartX = useRef<number | null>(null);

  const COUNT = reels.length;

  // Pausa o vídeo que estiver tocando (usado ao navegar / trocar).
  const pauseCurrent = useCallback(() => {
    if (playingIndex === null) return;
    const v = videoRefs.current[playingIndex];
    if (v && !v.paused) v.pause();
    setPlayingIndex(null);
  }, [playingIndex]);

  const goTo = useCallback(
    (index: number) => {
      pauseCurrent();
      setActive(((index % COUNT) + COUNT) % COUNT);
    },
    [COUNT, pauseCurrent]
  );

  const go = useCallback(
    (dir: 1 | -1) => goTo(active + dir),
    [active, goTo]
  );

  const playAt = (i: number) => {
    // Garante que qualquer outro vídeo pare antes de iniciar este.
    videoRefs.current.forEach((v, idx) => {
      if (v && idx !== i && !v.paused) v.pause();
    });
    const v = videoRefs.current[i];
    if (!v) return;
    setActive(i);
    v.play();
    setPlayingIndex(i);
  };

  // Clique no card central: alterna entre tocar e pausar o mesmo vídeo.
  const togglePlay = (i: number) => {
    const v = videoRefs.current[i];
    if (!v) return;
    if (playingIndex === i && !v.paused) {
      v.pause();
      setPlayingIndex(null);
    } else {
      playAt(i);
    }
  };

  // Setas do teclado quando o carrossel está focado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 45) go(delta < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <div
      className="reels-viewport"
      role="group"
      aria-roledescription="carrossel"
      aria-label="Vídeos de turmas reais"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        className="reels-arrow reels-arrow-prev"
        onClick={() => go(-1)}
        aria-label="Vídeo anterior"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="reels-stage">
        {reels.map((src, i) => {
          // Distância circular ao card ativo (coverflow).
          let offset = i - active;
          if (offset > COUNT / 2) offset -= COUNT;
          if (offset < -COUNT / 2) offset += COUNT;

          const isActive = offset === 0;
          const abs = Math.abs(offset);
          // Só o ativo + 1 vizinho de cada lado (visual limpo, sem pilha).
          const hidden = abs > 1;
          const isPlaying = playingIndex === i;
          const dimmed = playingIndex !== null && !isPlaying;

          return (
            <div
              key={`${src}-${i}`}
              className={`reel-card${isActive ? " is-active" : ""}${
                isPlaying ? " is-playing" : ""
              }${dimmed ? " is-dimmed" : ""}`}
              aria-hidden={hidden}
              style={{
                transform: `translateX(${offset * 78}%) scale(${
                  isActive ? 1 : 0.82
                })`,
                opacity: hidden ? 0 : dimmed ? 0.28 : isActive ? 1 : 0.5,
                zIndex: isActive ? 30 : 10 - abs,
                pointerEvents: hidden ? "none" : undefined,
                visibility: hidden ? "hidden" : "visible",
              }}
            >
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                src={src}
                loop={false}
                playsInline
                preload="metadata"
                disablePictureInPicture
                controlsList="nodownload noremoteplayback nofullscreen noplaybackrate"
                onEnded={() => setPlayingIndex(null)}
                onPause={() =>
                  setPlayingIndex((cur) => (cur === i ? null : cur))
                }
                onPlay={() => setPlayingIndex(i)}
                className="reel-video select-none"
              >
                Seu navegador não suporta vídeos.
              </video>
              <div className="reel-card-shade" aria-hidden />

              <button
                type="button"
                className={`reel-overlay-btn${
                  isPlaying ? " is-playing" : ""
                }`}
                onClick={() =>
                  isActive ? togglePlay(i) : goTo(i)
                }
                aria-label={
                  !isActive
                    ? `Ir para o vídeo ${i + 1}`
                    : isPlaying
                      ? `Pausar vídeo ${i + 1}`
                      : `Reproduzir vídeo ${i + 1}`
                }
              >
                {isActive && (
                  <span className="reel-ctrl-icon" aria-hidden>
                    {isPlaying ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="reels-arrow reels-arrow-next"
        onClick={() => go(1)}
        aria-label="Próximo vídeo"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="reels-dots" role="tablist" aria-label="Selecionar vídeo">
        {reels.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Ir para o vídeo ${i + 1}`}
            className={`reels-dot${i === active ? " is-active" : ""}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
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

        {/* Reels verticais — vídeos pausados; o formando clica no play.
            Ao tocar, o card cresce e os demais escurecem; setas/dots
            navegam e pausam automaticamente o vídeo em reprodução. */}
        <ReelsCarousel />



        <div className="mt-12 mb-10 text-center fade-up md:mt-16 md:mb-12">
          <span className="tech-eyebrow mx-auto">
            <span className="dot" />
            Depoimentos
          </span>
          <h2 className="mt-7 font-serif text-3xl leading-[1.1] tracking-premium-tight text-text-primary md:text-4xl">
            O que os formandos dizem sobre a{" "}
            <span className="italic font-light text-gray-500">Alpha.</span>
          </h2>

          <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-line bg-bg-white px-4 py-2">
            <span className="text-[10px] uppercase tracking-premium-wide text-text-tertiary">
              Avaliações reais no
            </span>
            <svg
              width="58"
              height="19"
              viewBox="0 0 272 92"
              aria-label="Google"
              role="img"
            >
              <path
                fill="#EA4335"
                d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
              />
              <path
                fill="#FBBC05"
                d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
              />
              <path
                fill="#4285F4"
                d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"
              />
              <path fill="#34A853" d="M225 3v65h-9.5V3h9.5z" />
              <path
                fill="#EA4335"
                d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.13zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"
              />
              <path
                fill="#4285F4"
                d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"
              />
            </svg>
          </div>

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
