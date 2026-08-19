"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import AuthMediaPanel from "./AuthMediaPanel";
import {
  AUTH,
  DIAGONAL_INSET,
  FORM_W,
  PANEL_W,
  SWAP_DURATION,
  SWAP_EASE,
} from "./tokens";

export type AuthEstado = "entrar" | "criar";

/**
 * Diagonal do painel, em clip-path.
 *
 * "entrar": painel à direita, aresta esquerda inclinada (14% no topo, 0 na base).
 * "criar":  painel à esquerda, aresta direita inclinada — o espelho da anterior.
 * Os dois polígonos têm 4 pontos, o que permite ao Framer interpolar a virada.
 */
const CLIP: Record<AuthEstado, string> = {
  entrar: `polygon(${DIAGONAL_INSET}% 0%, 100% 0%, 100% 100%, 0% 100%)`,
  criar: `polygon(0% 0%, ${100 - DIAGONAL_INSET}% 0%, 100% 100%, 0% 100%)`,
};

/** Deslocamento em % da própria largura de cada bloco. */
const PANEL_X: Record<AuthEstado, string> = {
  entrar: `${((100 - PANEL_W) / PANEL_W) * 100}%`,
  criar: "0%",
};
const FORM_X: Record<AuthEstado, string> = {
  entrar: "0%",
  criar: `${((100 - FORM_W) / FORM_W) * 100}%`,
};

export default function AuthCard({
  estado,
  onTrocar,
  formEntrar,
  formCriar,
}: {
  estado: AuthEstado;
  onTrocar: () => void;
  formEntrar: ReactNode;
  formCriar: ReactNode;
}) {
  const semMovimento = useReducedMotion();
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const transicao = {
    duration: semMovimento ? 0 : SWAP_DURATION,
    ease: SWAP_EASE as unknown as number[],
  };

  const form = estado === "entrar" ? formEntrar : formCriar;

  /* ─── Mobile: painel virou faixa no topo e o formulário vem abaixo.
         Sem diagonal e sem deslize lateral — em tela estreita a divisão
         apertada não caberia. ─── */
  if (!desktop) {
    return (
      <div
        className="relative w-full overflow-hidden"
        style={{
          width: "calc(100vw - 32px)",
          maxWidth: 520,
          borderRadius: 24,
          background: AUTH.warmWhite,
          border: `1px solid ${AUTH.hairline}`,
          boxShadow: "0 32px 90px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ height: 256 }}>
          <AuthMediaPanel estado={estado} onTrocar={onTrocar} compacto />
        </div>

        <div className="px-6 py-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={estado}
              initial={semMovimento ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={semMovimento ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: semMovimento ? 0 : 0.36, ease: "easeOut" }}
            >
              {form}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  /* ─── Desktop: duas metades com diagonal, painel deslizando de lado. ─── */
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: "min(1120px, calc(100vw - 96px))",
        height: "clamp(620px, 74vh, 680px)",
        borderRadius: 24,
        // A base clara é o fundo do formulário; o painel escuro entra por cima
        // recortado na diagonal, então a cunha do recorte revela esta camada.
        background: AUTH.warmWhite,
        border: `1px solid ${AUTH.border}`,
        boxShadow: "0 32px 90px rgba(0,0,0,0.18)",
      }}
    >
      {/* painel visual */}
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{ width: `${PANEL_W}%` }}
        initial={false}
        animate={{ x: PANEL_X[estado], clipPath: CLIP[estado] }}
        transition={transicao}
      >
        <AuthMediaPanel estado={estado} onTrocar={onTrocar} />
      </motion.div>

      {/* formulário */}
      <motion.div
        className="absolute inset-y-0 left-0 flex items-center"
        style={{ width: `${FORM_W}%` }}
        initial={false}
        animate={{ x: FORM_X[estado] }}
        transition={transicao}
      >
        <div className="max-h-full w-full overflow-y-auto px-10 py-10 lg:px-14">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={estado}
              initial={
                semMovimento
                  ? false
                  : { opacity: 0, x: estado === "entrar" ? -18 : 18, filter: "blur(3px)" }
              }
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={
                semMovimento
                  ? undefined
                  : { opacity: 0, x: estado === "entrar" ? 18 : -18, filter: "blur(3px)" }
              }
              transition={{
                duration: semMovimento ? 0 : SWAP_DURATION * 0.5,
                ease: SWAP_EASE as unknown as number[],
              }}
            >
              {form}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
