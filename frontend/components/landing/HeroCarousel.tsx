"use client";

import { useEffect, useState } from "react";
import MediaFrame from "./MediaFrame";
import { HERO_TILES } from "@/lib/landingMedia";

/**
 * Largura do card central — definida como `--hero-card` na página, porque a
 * faixa preta seguinte precisa do mesmo número para reservar o espaço que as
 * peças invadem.
 */
const CARD_W = "var(--hero-card)";
/**
 * Distância entre centros, em fração da largura do card.
 *
 * A lateral, girada 18° e reduzida a 0.9, ocupa 0.9·cos(18°) ≈ 0.856 da largura
 * — meia largura projetada = 0.428. Com 0.95 sobra uma fresta de ~2% entre as
 * peças, e as três juntas passam de 2.71 larguras: mais que a janela quando o
 * card mede 39vw, o que faz as laterais atravessarem a borda da tela.
 */
const SPACING = 0.95;
/**
 * Giro em 3D das laterais. A do meio fica reta; as vizinhas viram para dentro,
 * com a ponta de fora recuando — é esse ângulo que dá o volume da referência.
 */
const ANGLE = 18;
/** Quanto as laterais escurecem, para a do meio saltar. */
const VEU = 0.18;

/**
 * Fatia da peça que fica sobre o vídeo. O restante invade a faixa preta — a
 * seção seguinte lê este mesmo número para reservar o espaço, por isso ele é
 * exportado em vez de repetido lá.
 */
export const SOBRE_VIDEO = 0.45;

/**
 * Carrossel do herói no estilo coverflow.
 *
 * A peça central fica reta, inteira e em tamanho cheio; as laterais giram para
 * dentro, encolhem e escurecem, e as das pontas saem pela borda da janela.
 * Avança sozinha e pausa quando o mouse entra.
 */
export default function HeroCarousel() {
  const total = HERO_TILES.length;
  const [ativo, setAtivo] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setAtivo((a) => (a + 1) % total), 3800);
    return () => clearInterval(id);
  }, [pausado, total]);

  return (
    <div
      onPointerEnter={() => setPausado(true)}
      onPointerLeave={() => setPausado(false)}
      className="relative z-20 mx-auto"
      style={{
        // Sobe 62% da peça por cima do vídeo. A altura reservada é a mesma, o
        // que faz a faixa preta começar exatamente na borda do herói — os 38%
        // restantes das peças ficam por cima dela.
        marginTop: `calc(${CARD_W} * -${SOBRE_VIDEO})`,
        height: `calc(${CARD_W} * ${SOBRE_VIDEO})`,
        perspective: "1600px",
      }}
    >
      {HERO_TILES.map((slot, i) => {
        // Distância circular até a peça ativa: -1 é a vizinha da esquerda.
        let offset = i - ativo;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;

        const dist = Math.abs(offset);
        // Só a peça central e as duas vizinhas ficam na tela.
        const escondida = dist > 1;

        return (
          <button
            key={slot.src}
            type="button"
            onClick={() => setAtivo(i)}
            aria-label={`Ver peça ${i + 1}`}
            aria-hidden={escondida}
            tabIndex={escondida ? -1 : 0}
            className="absolute left-1/2 top-0 block cursor-pointer border-0 p-0"
            style={{
              width: CARD_W,
              transform: [
                "translateX(-50%)",
                `translateX(calc(${CARD_W} * ${SPACING} * ${offset}))`,
                `rotateY(${offset * ANGLE}deg)`,
                `scale(${1 - dist * 0.1})`,
              ].join(" "),
              zIndex: 10 - dist,
              opacity: escondida ? 0 : 1,
              pointerEvents: escondida ? "none" : "auto",
              // As peças fora de cena pulam de ponta a ponta ao dar a volta;
              // sem transição o salto acontece invisível.
              transition: escondida
                ? "none"
                : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 700ms ease",
              background: "transparent",
            }}
          >
            <div className="relative">
              <MediaFrame
                slot={slot}
                tone="dark"
                className="w-full"
                // O card mede `--hero-card` (39vw, teto de 900px). Sem dizer
                // isso ao Next ele assumia 33vw e servia uma variante menor,
                // que o navegador ampliava — daí a imagem sair mole.
                sizes="(max-width: 640px) 300px, (max-width: 2300px) 39vw, 900px"
                style={{ aspectRatio: "1 / 1", borderRadius: 8 }}
              />
              {/* Véu que apaga as peças de trás */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  borderRadius: 8,
                  background: "#000000",
                  opacity: dist === 0 ? 0 : VEU,
                  transition: "opacity 700ms ease",
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
