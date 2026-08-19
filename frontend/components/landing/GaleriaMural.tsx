"use client";

import Image from "next/image";
import { GALERIA_MURAL } from "@/lib/landingMedia";

/* ──────────────────────────────────────────────────────────────────────────
   Mural da galeria.

   Colunas de peças deslizando devagar sobre fundo escuro, com o título ao
   centro e as bordas se apagando no preto.

   O deslize é CSS puro: cada coluna repete a própria lista duas vezes e
   desloca -50% da própria altura, o que faz a volta emendar sem salto. Sem
   JavaScript, então não custa nada em desempenho e não trava a rolagem.

   São cinco colunas; em telas menores as duas últimas somem por CSS, e o que
   sobra continua fechando o loop porque cada coluna é independente.
   ────────────────────────────────────────────────────────────────────────── */

const COLUNAS = 5;

/** Duração e sentido por coluna — o desencontro é o que evita o efeito grade. */
const RITMO = [
  { s: 58, sentido: "sobe" },
  { s: 74, sentido: "desce" },
  { s: 64, sentido: "sobe" },
  { s: 80, sentido: "desce" },
  { s: 68, sentido: "sobe" },
] as const;

export default function GaleriaMural() {
  // Distribui as peças em ciclo entre as colunas.
  const colunas = Array.from({ length: COLUNAS }, (_, c) =>
    GALERIA_MURAL.filter((_, i) => i % COLUNAS === c),
  );

  return (
    <section
      id="galeria"
      className="relative w-full overflow-hidden bg-obsidian"
      style={{ height: "clamp(560px, 76vh, 760px)" }}
    >
      {/* as colunas */}
      <div className="absolute inset-0 flex justify-center gap-3 md:gap-4">
        {colunas.map((peças, c) => (
          <div
            key={c}
            // A 4ª e a 5ª coluna só aparecem em tela larga.
            className={`w-[42%] shrink-0 sm:w-[30%] md:w-[23%] lg:w-[19%] ${
              c === 3 ? "hidden md:block" : c === 4 ? "hidden lg:block" : ""
            }`}
          >
            <div
              className="galeria-col flex flex-col gap-3 md:gap-4"
              style={{
                animationName:
                  RITMO[c].sentido === "sobe" ? "galeriaSobe" : "galeriaDesce",
                animationDuration: `${RITMO[c].s}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                willChange: "transform",
              }}
            >
              {/* a lista vai duas vezes: é o que emenda o loop */}
              {[...peças, ...peças].map((p, i) => (
                <Image
                  key={`${p.src}-${i}`}
                  src={p.src}
                  alt=""
                  aria-hidden
                  width={p.w}
                  height={p.h}
                  sizes="(max-width: 640px) 42vw, (max-width: 1024px) 23vw, 19vw"
                  className="h-auto w-full"
                  style={{ borderRadius: 8, display: "block" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* véu: escurece o miolo para o título ler, e apaga as bordas no preto */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 44% at 50% 50%, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.62) 55%, rgba(0,0,0,0.20) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #000000 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,0) 76%, #000000 100%)",
        }}
      />

      {/* título */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <h2
          className="font-light text-paper"
          style={{
            fontSize: "clamp(34px, 5.5vw, 64px)",
            lineHeight: 0.95,
            letterSpacing: "-0.05em",
          }}
        >
          Feito para
          <br />
          turmas reais
        </h2>
        <p className="mt-6 max-w-[44ch] text-[14px] font-normal leading-[1.5] text-ash">
          Convites que já saíram da gráfica e chegaram às mãos de formandos em
          todo o Brasil.
        </p>
      </div>
    </section>
  );
}
