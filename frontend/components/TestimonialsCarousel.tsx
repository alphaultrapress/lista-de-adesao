"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// =====================================================================
// Carrossel de depoimentos reais (prints) — coverflow premium
// ---------------------------------------------------------------------
// Imagens em /public/depoimentos/1.png .. 5.png. Cada print tem altura
// diferente, então usamos a proporção real (width/height) de cada um e
// object-fit: contain — nunca corta o texto do depoimento.
// =====================================================================

type Slide = {
  src: string;
  width: number;
  height: number;
};

const slides: Slide[] = [
  { src: "/depoimentos/1.png", width: 674, height: 213 },
  { src: "/depoimentos/2.png", width: 683, height: 431 },
  { src: "/depoimentos/3.png", width: 674, height: 208 },
  { src: "/depoimentos/4.png", width: 678, height: 337 },
  { src: "/depoimentos/5.png", width: 689, height: 167 },
];

const AUTOPLAY_MS = 4500;
const COUNT = slides.length;

export default function TestimonialsCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback((dir: 1 | -1) => {
    setActive((prev) => (prev + dir + COUNT) % COUNT);
  }, []);

  // Autoplay com cleanup; pausa no hover (desktop) ou ao arrastar.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % COUNT);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, active]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <div
      className="testimonials-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="group"
      aria-roledescription="carrossel"
      aria-label="Depoimentos de clientes Alpha"
    >
      <div className="testimonials-stage">
        {slides.map((slide, i) => {
          // Distância circular do slide ativo (-2..2) para o efeito coverflow.
          let offset = i - active;
          if (offset > COUNT / 2) offset -= COUNT;
          if (offset < -COUNT / 2) offset += COUNT;

          const isActive = offset === 0;
          const abs = Math.abs(offset);
          // Esconde slides muito distantes (mantém só ativo + 2 vizinhos).
          const hidden = abs > 2;

          return (
            <div
              key={slide.src}
              className={`testimonial-card${isActive ? " is-active" : ""}`}
              data-offset={offset}
              aria-hidden={!isActive}
              style={{
                transform: `translateX(${offset * 56}%) scale(${
                  isActive ? 1 : 0.86
                })`,
                opacity: hidden ? 0 : isActive ? 1 : 0.4,
                // Card ativo acima do fade lateral (z-index 20); vizinhos abaixo.
                zIndex: isActive ? 30 : 9 - abs,
                pointerEvents: hidden ? "none" : undefined,
                visibility: hidden ? "hidden" : "visible",
              }}
            >
              <button
                type="button"
                className="testimonial-card-btn"
                tabIndex={isActive ? 0 : -1}
                aria-label={`Ver depoimento ${i + 1} de ${COUNT}`}
                onClick={() => !isActive && setActive(i)}
              >
                <Image
                  src={slide.src}
                  alt={`Depoimento de cliente Alpha ${i + 1}`}
                  width={slide.width}
                  height={slide.height}
                  sizes="(max-width: 768px) 90vw, 640px"
                  quality={92}
                  priority={i === 0}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="testimonial-img"
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="testimonial-dots" role="tablist" aria-label="Selecionar depoimento">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Ir para o depoimento ${i + 1}`}
            className={`testimonial-dot${i === active ? " is-active" : ""}`}
            onClick={() => setActive(i)}
          />
        ))}
      </div>
    </div>
  );
}
