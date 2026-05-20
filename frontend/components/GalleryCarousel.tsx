"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const IMAGES = [
  "/images/Galeria/01.jpg",
  "/images/Galeria/02.jpg",
  "/images/Galeria/03.jpg",
  "/images/Galeria/34.png",
  "/images/Galeria/35.png",
  "/images/Galeria/36.png",
  "/images/Galeria/37.png",
  "/images/Galeria/63.png",
  "/images/Galeria/64.png",
  "/images/Galeria/65.png",
  "/images/Galeria/76.png",
  "/images/Galeria/77.png",
  "/images/Galeria/78.png",
  "/images/Galeria/128.png",
  "/images/Galeria/129.png",
  "/images/Galeria/130.png",
  "/images/Galeria/131.png",
  "/images/Galeria/132.png",
  "/images/Galeria/133.png",
];

const AUTOPLAY_MS = 4500;

export default function GalleryCarousel() {
  const [index, setIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [perView, setPerView] = useState(3);

  const total = IMAGES.length;

  useEffect(() => {
    const compute = () => {
      if (window.innerWidth >= 1024) setPerView(3);
      else if (window.innerWidth >= 640) setPerView(2);
      else setPerView(1);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);

  // Autoplay
  useEffect(() => {
    if (isPaused || lightboxIndex !== null) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [isPaused, lightboxIndex, next]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i === null ? null : (i + 1) % total));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) =>
          i === null ? null : (i - 1 + total) % total,
        );
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, total]);

  return (
    <section className="relative overflow-hidden bg-[#FAFAFA] pt-24 md:pt-32 pb-32 md:pb-40 border-t border-[rgba(0,0,0,0.06)]">
      {/* Background grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#0A0A0A 1px, transparent 1px), linear-gradient(90deg, #0A0A0A 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* Soft red glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[900px] rounded-full bg-[#C41230] opacity-[0.05] blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header — apenas "Galeria Alpha" como protagonista */}
        <div className="mb-14 text-center fade-up flex flex-col items-center">
          <h2
            className="font-serif font-light text-[#0A0A0A]"
            style={{
              fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            <span className="italic font-medium text-[#C41230]">Galeria</span>{" "}
            Alpha
          </h2>
          <div
            aria-hidden
            className="mt-8 flex items-center gap-3"
          >
            <span
              className="h-px w-14"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, #C41230 100%)",
              }}
            />
            <span
              className="inline-block h-1.5 w-1.5 rotate-45"
              style={{
                background:
                  "linear-gradient(135deg, #FF6B85 0%, #C41230 100%)",
                boxShadow: "0 0 8px rgba(196,18,48,0.5)",
              }}
            />
            <span
              className="h-px w-14"
              style={{
                background:
                  "linear-gradient(90deg, #C41230 0%, transparent 100%)",
              }}
            />
          </div>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden py-12 -my-12">
            <div
              className="flex transition-transform duration-[450ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]"
              style={{
                transform: `translateX(calc(50% - ${50 / perView}% - ((${index} + ${total}) * ${100 / perView}%)))`,
              }}
            >
              {[...IMAGES, ...IMAGES, ...IMAGES].map((src, virtualIdx) => {
                const i = virtualIdx % total;
                const isActive = i === index;
                return (
                  <button
                    key={virtualIdx}
                    type="button"
                    onClick={() => {
                      if (isActive) setLightboxIndex(i);
                      else setIndex(i);
                    }}
                    className="group relative shrink-0 px-4 py-2 outline-none"
                    style={{ width: `${100 / perView}%` }}
                    aria-label={`Abrir imagem ${i + 1}`}
                  >
                    <div
                      className={`relative overflow-hidden rounded-[6px] transition-all duration-[400ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
                        isActive
                          ? "scale-100 opacity-100"
                          : "scale-[0.9] opacity-55 group-hover:opacity-85"
                      }`}
                      style={{
                        aspectRatio: "4 / 5",
                        boxShadow: isActive
                          ? "0 30px 60px rgba(20,15,10,0.18), 0 8px 22px rgba(196,18,48,0.08)"
                          : "0 10px 24px rgba(20,15,10,0.08)",
                      }}
                    >
                      <Image
                        src={src}
                        alt={`Convite Alpha ${i + 1}`}
                        fill
                        quality={100}
                        sizes="(max-width: 768px) 95vw, (max-width: 1280px) 48vw, 38vw"
                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                      />
                      {/* Vignette + zoom icon on hover */}
                      <div
                        className={`absolute inset-0 transition-opacity duration-500 ${
                          isActive
                            ? "opacity-0 group-hover:opacity-100"
                            : "opacity-0"
                        }`}
                        style={{
                          background:
                            "linear-gradient(to top, rgba(10,8,5,0.55) 0%, rgba(10,8,5,0) 55%)",
                        }}
                      />
                      <div
                        className={`absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all duration-500 ${
                          isActive
                            ? "opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2"
                            : "opacity-0"
                        }`}
                        style={{
                          background: "rgba(255,255,255,0.85)",
                          border: "1px solid rgba(196,18,48,0.3)",
                          boxShadow: "0 6px 18px rgba(20,15,10,0.18)",
                        }}
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#C41230"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Arrows — transparent, no border */}
          <button
            type="button"
            onClick={prev}
            aria-label="Anterior"
            className="absolute top-1/2 -translate-y-1/2 left-2 md:left-4 z-20 flex h-14 w-14 items-center justify-center text-[#0A0A0A] transition-all duration-300 hover:scale-110 hover:text-[#C41230]"
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Próxima"
            className="absolute top-1/2 -translate-y-1/2 right-2 md:right-4 z-20 flex h-14 w-14 items-center justify-center text-[#0A0A0A] transition-all duration-300 hover:scale-110 hover:text-[#C41230]"
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Progress dots */}
        <div className="mt-16 flex items-center justify-center gap-1.5">
          {IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir para imagem ${i + 1}`}
              className="group relative h-[6px] rounded-full transition-all duration-500 ease-out"
              style={{
                width: i === index ? "28px" : "6px",
                background:
                  i === index
                    ? "linear-gradient(90deg, #C41230 0%, #FF6B85 100%)"
                    : "rgba(10,10,10,0.15)",
                boxShadow:
                  i === index ? "0 0 12px rgba(196,18,48,0.4)" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center animate-[lbFadeIn_0.25s_ease-out]"
          onClick={() => setLightboxIndex(null)}
          style={{
            background: "rgba(10,8,5,0.72)",
            backdropFilter: "blur(14px) saturate(130%)",
            WebkitBackdropFilter: "blur(14px) saturate(130%)",
          }}
        >
          {/* Close */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            aria-label="Fechar"
            className="absolute top-6 right-6 z-10 flex h-12 w-12 items-center justify-center text-white/80 transition-all duration-300 hover:scale-110 hover:text-white"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {/* Prev */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i === null ? null : (i - 1 + total) % total));
            }}
            aria-label="Anterior"
            className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-10 flex h-16 w-16 items-center justify-center text-white/70 transition-all duration-300 hover:scale-110 hover:text-white"
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(90vw, 1400px)",
              height: "min(90vh, 1400px)",
              filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.5))",
            }}
          >
            <Image
              src={IMAGES[lightboxIndex]}
              alt={`Convite Alpha ${lightboxIndex + 1}`}
              fill
              quality={100}
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Preload prev + next para troca instantânea */}
          <div className="hidden">
            <Image
              src={IMAGES[(lightboxIndex + 1) % total]}
              alt=""
              width={1}
              height={1}
              priority
            />
            <Image
              src={IMAGES[(lightboxIndex - 1 + total) % total]}
              alt=""
              width={1}
              height={1}
              priority
            />
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i === null ? null : (i + 1) % total));
            }}
            aria-label="Próxima"
            className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-10 flex h-16 w-16 items-center justify-center text-white/70 transition-all duration-300 hover:scale-110 hover:text-white"
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Counter */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 font-sans text-[10.5px] uppercase font-medium text-white/70"
            style={{ letterSpacing: "0.32em" }}
          >
            <span className="text-white font-semibold">
              {String(lightboxIndex + 1).padStart(2, "0")}
            </span>
            <span className="mx-2 opacity-40">/</span>
            <span>{String(total).padStart(2, "0")}</span>
          </div>

          <style jsx>{`
            @keyframes lbFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </section>
  );
}
