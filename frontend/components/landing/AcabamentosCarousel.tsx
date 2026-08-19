"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ACABAMENTOS } from "@/lib/landingMedia";

/* ──────────────────────────────────────────────────────────────────────────
   Carrossel dos acabamentos.

   Estrutura de card da referência: título e descrição em cima, imagem
   ocupando a parte de baixo, seta no canto inferior direito. Quatro por vez
   no desktop; o resto entra pela rolagem horizontal, com encaixe (snap).

   A rolagem é nativa — assim funciona com arraste, trackpad e teclado sem
   nenhum código extra. Os botões só empurram o scroll de uma página.
   ────────────────────────────────────────────────────────────────────────── */

export default function AcabamentosCarousel() {
  const trilhoRef = useRef<HTMLDivElement>(null);
  const [progresso, setProgresso] = useState(0);
  const [noInicio, setNoInicio] = useState(true);
  const [noFim, setNoFim] = useState(false);

  const sincronizar = useCallback(() => {
    const el = trilhoRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgresso(max > 0 ? el.scrollLeft / max : 0);
    setNoInicio(el.scrollLeft < 8);
    setNoFim(el.scrollLeft > max - 8);
  }, []);

  useEffect(() => {
    const el = trilhoRef.current;
    if (!el) return;
    sincronizar();
    el.addEventListener("scroll", sincronizar, { passive: true });
    window.addEventListener("resize", sincronizar);
    return () => {
      el.removeEventListener("scroll", sincronizar);
      window.removeEventListener("resize", sincronizar);
    };
  }, [sincronizar]);

  function mover(direcao: 1 | -1) {
    const el = trilhoRef.current;
    if (!el) return;
    el.scrollBy({ left: direcao * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <>
      <div
        ref={trilhoRef}
        className="acab-trilho flex gap-6 overflow-x-auto pb-1"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
      >
        {ACABAMENTOS.map(({ title, desc, slot }) => (
          <article
            key={slot.src}
            className="group flex w-[78%] flex-none flex-col sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
            style={{ aspectRatio: "3 / 4", scrollSnapAlign: "start" }}
          >
            {/* Texto no topo, sem fundo: fica direto sobre o branco da seção,
                então a cor dele é preta. Só a imagem tem caixa. */}
            <div className="pb-4">
              <h3
                className="font-light text-obsidian"
                style={{ fontSize: 19, lineHeight: 1.2, letterSpacing: "-0.02em" }}
              >
                {title}
              </h3>
              <p className="mt-1.5 text-[12.5px] font-normal leading-[1.4] text-ash">
                {desc}
              </p>
            </div>

            {/* imagem preenchendo o que sobra, com a seta por cima */}
            <div
              className="relative flex-1 overflow-hidden bg-obsidian"
              style={{ borderRadius: 8 }}
            >
              <Image
                src={slot.src}
                alt={title}
                fill
                sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <span
                aria-hidden
                className="absolute bottom-4 right-4 text-[16px] text-paper transition-transform duration-300 group-hover:translate-x-1"
                style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
              >
                &rarr;
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* indicador de posição e setas */}
      <div className="mt-8 flex items-center justify-between gap-6">
        <div className="relative h-px w-[120px] overflow-hidden" style={{ background: "#DDDDDD" }}>
          <span
            className="absolute inset-y-0 left-0 bg-obsidian transition-[width,transform] duration-300"
            style={{ width: "34%", transform: `translateX(${progresso * (100 / 0.34 - 100)}%)` }}
          />
        </div>

        <div className="flex items-center gap-2">
          {[
            { dir: -1 as const, label: "Anterior", desativado: noInicio, seta: "\u2190" },
            { dir: 1 as const, label: "Próximo", desativado: noFim, seta: "\u2192" },
          ].map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => mover(b.dir)}
              disabled={b.desativado}
              aria-label={b.label}
              className="flex h-10 w-10 items-center justify-center border transition-colors duration-300 disabled:opacity-30"
              style={{ borderColor: "#DDDDDD", borderRadius: 100, color: "#000000" }}
            >
              {b.seta}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
