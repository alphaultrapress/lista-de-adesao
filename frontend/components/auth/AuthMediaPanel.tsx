"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { AuthGhostButton } from "./AuthButton";
import {
  AUTH,
  DIAGONAL_INSET,
  DIAGONAL_PAD,
  SWAP_DURATION,
  SWAP_EASE,
} from "./tokens";

/* ══════════════════════════════════════════════════════════════════════════
   PONTO DE INSERÇÃO DA IMAGEM DO PAINEL

   Para colocar a imagem definitiva, basta preencher AUTH_MEDIA_SRC com o
   caminho do arquivo em /public — por exemplo "/landing/auth.jpg".

   Nada mais precisa mudar: a imagem entra por baixo do texto preenchendo o
   painel inteiro com object-fit: cover / object-position: center, e o overlay
   logo abaixo garante a leitura. Ajuste AUTH_MEDIA_OVERLAY (0 a 1) se a foto
   escolhida for clara demais.

   Formato ideal do arquivo: retrato 4:5 — 1200 × 1500.
   ══════════════════════════════════════════════════════════════════════════ */
export const AUTH_MEDIA_SRC: string | null = null;
export const AUTH_MEDIA_OVERLAY = 0.58;

/** Altura da marca d'água do canto, em px. A largura sai dela. */
const MARCA_H = 52;

type Estado = "entrar" | "criar";

/** Só o essencial: um título, uma linha de apoio e a ação. */
const COPY: Record<Estado, { titulo: string; texto: string; acao: string }> = {
  entrar: {
    titulo: "Olá, que bom\nter você aqui.",
    texto: "Acompanhe cada etapa da sua turma.",
    acao: "Criar minha conta",
  },
  criar: {
    titulo: "Bem-vindo\nà Alpha.",
    texto: "Comece essa história com a sua turma.",
    acao: "Já tenho uma conta",
  },
};

export default function AuthMediaPanel({
  estado,
  onTrocar,
  compacto = false,
  compactoMobile = false,
}: {
  estado: Estado;
  onTrocar: () => void;
  /** No mobile o painel virou faixa: sem diagonal, então sem recuo extra. */
  compacto?: boolean;
  compactoMobile?: boolean;
}) {
  const semMovimento = useReducedMotion();
  const [mobile, setMobile] = useState(false);
  const copy = COPY[estado];

  useEffect(() => {
    if (!compactoMobile) return;

    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [compactoMobile]);

  const usarLayoutCompacto = compacto || (compactoMobile && mobile);

  // A aresta inclinada troca de lado junto com o estado, e o recuo do texto
  // acompanha: "entrar" tem a diagonal à esquerda, "criar" à direita.
  const recuo = `calc(${DIAGONAL_INSET}% + ${DIAGONAL_PAD}px)`;
  const base = 40;
  const padding = usarLayoutCompacto
    ? { padding: 24 }
    : {
        paddingTop: base,
        paddingBottom: base,
        paddingLeft: estado === "entrar" ? recuo : base,
        paddingRight: estado === "entrar" ? base : recuo,
      };

  /** Canto livre da diagonal — onde os elementos decorativos podem ficar. */
  const ladoSeguro =
    estado === "entrar" ? { right: base } : { left: base };

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: AUTH.panel }}>
      {/* ─── camada 1: a imagem, quando existir ─── */}
      {AUTH_MEDIA_SRC && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={AUTH_MEDIA_SRC}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      )}

      {/* ─── camada 2: overlay de leitura, configurável ─── */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: AUTH_MEDIA_SRC
            ? `linear-gradient(180deg, rgba(17,18,16,${AUTH_MEDIA_OVERLAY * 0.8}) 0%, rgba(17,18,16,${AUTH_MEDIA_OVERLAY}) 100%)`
            : "transparent",
        }}
      />

      {/* ─── camada 3: brilho de laca ───
          O "liso": nenhuma grade, nenhuma textura à vista. O volume vem de um
          reflexo largo e suavíssimo, como preto piano. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 22% 8%, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 34%, rgba(255,255,255,0) 62%)",
        }}
      />
      {/* vinheta discreta nas bordas, para o preto não achatar */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 120% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)",
        }}
      />
      {/* ruído em 2% — invisível, só evita banding no degradê */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: 0.02,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ─── marca d'água no canto oposto à diagonal ───
          É o próprio arquivo do logo, não texto: assim a fonte é exatamente a
          da marca, sem depender de ter a tipografia instalada.

          O recorte: logo-white.png é 2000×1000 e a marca ocupa só 41% da
          altura, então a caixa precisa ser 2000/(0.41·1000) = 4.878× mais larga
          que alta para o object-fit: cover comer só a transparência. */}
      {!usarLayoutCompacto && (
        <span
          aria-hidden
          className="pointer-events-none absolute block overflow-hidden"
          style={{
            ...ladoSeguro,
            top: base - 4,
            height: MARCA_H,
            width: Math.round(MARCA_H * 4.878),
            // Branca, mas apagada: marca d'água discreta que não briga com o título.
            opacity: 0.2,
            // Branco chapado: brightness(0) achata tudo em preto preservando o
            // alfa e invert(1) devolve em branco puro — o vermelho do logo sai
            // sem precisar de um arquivo novo.
            filter: "brightness(0) invert(1)",
            transition: `left ${SWAP_DURATION}s, right ${SWAP_DURATION}s`,
          }}
        >
          <Image
            src="/logos/logo-white.png"
            alt=""
            width={Math.round(MARCA_H * 4.878)}
            height={MARCA_H}
            className="h-full w-full"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </span>
      )}

      {/* ─── conteúdo ─── */}
      <div
        className="relative flex h-full flex-col"
        style={{
          ...padding,
          transition: `padding ${SWAP_DURATION}s cubic-bezier(0.76, 0, 0.24, 1)`,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={estado}
            initial={semMovimento ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={semMovimento ? undefined : { opacity: 0, y: -14 }}
            transition={{
              duration: semMovimento ? 0 : SWAP_DURATION * 0.45,
              ease: SWAP_EASE as unknown as number[],
            }}
            className="mt-auto"
          >
            {/* o único vermelho da tela, junto do estado de erro */}
            <span
              aria-hidden
              className={usarLayoutCompacto ? "mb-4 block h-[2px] w-10" : "mb-7 block h-[2px] w-10"}
              style={{ background: AUTH.alphaRed }}
            />

            <p
              className="whitespace-pre-line font-light"
              style={{
                fontSize: usarLayoutCompacto ? 22 : "clamp(28px, 2.5vw, 36px)",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: AUTH.warmWhite,
              }}
            >
              {copy.titulo}
            </p>

            <p
              className={usarLayoutCompacto ? "mt-3 max-w-[34ch] text-[13px] leading-[1.5]" : "mt-4 max-w-[34ch] text-[13px] leading-[1.5]"}
              style={{ color: "rgba(250,249,246,0.58)" }}
            >
              {copy.texto}
            </p>

            <AuthGhostButton className={usarLayoutCompacto ? "mt-5" : "mt-8"} onClick={onTrocar}>
              {copy.acao}
            </AuthGhostButton>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
