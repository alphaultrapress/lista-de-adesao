"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Tela de carregamento da Alpha.

   Os quatro formandos são um WebM VP9 com alpha real, gerado do carregamento.mp4
   por chroma key (verde #67CE52). O corte usa os quadros 23–73 do original:
   são 3 ciclos exatos de passada, então o loop emenda sem salto, e os quadros
   de fade preto das pontas ficaram fora — em preto o chroma key não teria o
   que remover e sobraria um retângulo piscando.

   O vídeo foi recortado no bbox do grupo com quase nada de folga embaixo, então
   a borda inferior dele é a linha dos pés. Por isso ele é ancorado pelo bottom
   da faixa que fica logo acima da barra: os formandos apoiam sobre a linha.
   ────────────────────────────────────────────────────────────────────────── */

const WEBM = "/carregamento-alpha.webm";
/** Silhuetas já compostas sobre o off-white: sem alpha, mas idêntico nesta tela. */
const MP4_FALLBACK = "/carregamento-fallback.mp4";

/** 360×242 — mantém a altura previsível e evita CLS. */
const VIDEO_RATIO = 360 / 242;

const OFF_WHITE = "#F4F1EB";
const INK = "#111210";
const TRILHA = "rgba(17,18,16,0.14)";
const MUTED = "#6F6D68";

/** Uma passada é meio ciclo: 17 quadros a 24fps ÷ 2 ≈ 354ms. */
const PASSO_MS = 354;
const SAIDA_MS = 500;
/** Se a página ficar pronta antes disso, não vale prender a tela. */
const CURTO_MS = 180;

/**
 * Mantém a tela de carregamento montada até ela terminar de sair.
 *
 * As páginas fazem `if (loading) return ...`, o que desmontaria a tela no exato
 * instante em que os dados chegam — sem os 100%, sem os dois passos e sem o
 * fade. Com o gate, `loading` virar false só avisa que está pronto; quem decide
 * quando sumir é a própria tela.
 *
 * Uso:
 *   const { mostrando, tela } = useLoadingGate(loading);
 *   if (mostrando) return tela;
 */
export function useLoadingGate(loading: boolean) {
  const [visivel, setVisivel] = useState(true);

  return {
    mostrando: visivel || loading,
    tela: visivel ? (
      <LoadingScreen ready={!loading} onDone={() => setVisivel(false)} />
    ) : null,
  };
}

function statusPara(p: number) {
  if (p < 28) return "Reunindo a turma…";
  if (p < 55) return "Organizando os detalhes…";
  if (p < 80) return "Cuidando dos acabamentos…";
  if (p < 100) return "Últimos ajustes…";
  return "Tudo pronto.";
}

export default function LoadingScreen({
  ready,
  onDone,
}: {
  /** Vira true quando a página terminou de carregar de verdade. */
  ready: boolean;
  onDone?: () => void;
}) {
  const [progresso, setProgresso] = useState(0);
  const [fase, setFase] = useState<"carregando" | "passos" | "saindo" | "fim">(
    "carregando",
  );
  const [trilhaW, setTrilhaW] = useState(0);
  const [grupoW, setGrupoW] = useState(150);
  const [semMovimento, setSemMovimento] = useState(false);

  const trilhaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const montadoEm = useRef(0);

  // `onDone` é recriado a cada render do pai. Numa dependência de efeito isso
  // reiniciaria o timer da saída indefinidamente, então guardo numa ref.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    montadoEm.current = performance.now();
  }, []);

  // Movimento reduzido e largura do grupo saem da mesma fonte: matchMedia.
  useEffect(() => {
    const mqMov = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqLarg = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      setSemMovimento(mqMov.matches);
      setGrupoW(mqLarg.matches ? 150 : 110);
    };
    sync();
    mqMov.addEventListener("change", sync);
    mqLarg.addEventListener("change", sync);
    return () => {
      mqMov.removeEventListener("change", sync);
      mqLarg.removeEventListener("change", sync);
    };
  }, []);

  // Mede a trilha para virar progresso em pixels de translate3d.
  useEffect(() => {
    const el = trilhaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTrilhaW(el.offsetWidth));
    ro.observe(el);
    setTrilhaW(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (semMovimento) v.pause();
    else v.play().catch(() => {});
  }, [semMovimento]);

  /* Sobe rápido até 70, arrasta até 90 e espera ali. Os 100% só chegam quando
     `ready` confirma que a página está pronta. */
  useEffect(() => {
    if (fase !== "carregando") return;
    let raf = 0;
    let anterior = performance.now();

    const tick = (agora: number) => {
      const dt = agora - anterior;
      anterior = agora;
      setProgresso((p) => {
        if (p >= 90) return 90;
        const velocidade = p < 70 ? 0.085 : 0.012; // % por ms
        return Math.min(90, p + velocidade * dt);
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fase]);

  /* As três etapas da saída ficam em efeitos separados de propósito.
     Juntas num só, a troca de `fase` disparava a limpeza do próprio efeito,
     cancelava o timeout e, na reexecução, a condição de entrada já era falsa —
     o timeout nunca era reagendado e a tela travava em "Tudo pronto.". */

  // 1) pronto → fecha em 100% e entra na fase dos dois passos
  useEffect(() => {
    if (!ready || fase !== "carregando") return;
    setProgresso(100);
    setFase("passos");
  }, [ready, fase]);

  // 2) dois passos → começa a sair. Se ficou pronto quase de imediato, não
  //    faz sentido segurar a tela por enfeite: sai direto.
  useEffect(() => {
    if (fase !== "passos") return;
    const rapido = performance.now() - montadoEm.current < CURTO_MS;
    const espera = semMovimento || rapido ? 0 : PASSO_MS * 2;
    const t = setTimeout(() => setFase("saindo"), espera);
    return () => clearTimeout(t);
  }, [fase, semMovimento]);

  // 3) fim do fade → desmonta e avisa quem chamou
  useEffect(() => {
    if (fase !== "saindo") return;
    const t = setTimeout(() => {
      setFase("fim");
      onDoneRef.current?.();
    }, SAIDA_MS);
    return () => clearTimeout(t);
  }, [fase]);

  if (fase === "fim") return null;

  const p = Math.round(progresso);
  const saindo = fase === "saindo";
  const grupoH = Math.round(grupoW / VIDEO_RATIO);
  // 0% no começo da linha, 100% com o grupo encostando no fim.
  const x = trilhaW ? (progresso / 100) * Math.max(0, trilhaW - grupoW) : 0;
  const suave = semMovimento
    ? "none"
    : "transform 420ms cubic-bezier(0.33, 1, 0.68, 1)";

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center px-5"
      style={{
        background: OFF_WHITE,
        opacity: saindo ? 0 : 1,
        transform: saindo && !semMovimento ? "translateY(-12px)" : "none",
        transition: `opacity ${SAIDA_MS}ms ease, transform ${SAIDA_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
        pointerEvents: saindo ? "none" : "auto",
      }}
    >
      <span
        className="pointer-events-none absolute left-1/2 block h-[58px] w-[88px] -translate-x-1/2 overflow-hidden sm:h-[70px] sm:w-[106px]"
        style={{ top: 24 }}
      >
        <Image
          src="/logos/logo-dark.png"
          alt="Alpha Convites"
          width={106}
          height={70}
          priority
          className="h-full w-full"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </span>

      <div
        className="w-full pt-20 sm:pt-24"
        style={{ maxWidth: "min(680px, calc(100vw - 64px))" }}
      >
        <div ref={trilhaRef} className="relative w-full">
          <div className="relative w-full" style={{ height: grupoH }}>
            <div
              className="absolute bottom-0 left-0"
              style={{
                width: grupoW,
                height: grupoH,
                transform: `translate3d(${x}px, 0, 0)`,
                transition: suave,
                willChange: "transform",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                width={grupoW}
                height={grupoH}
                className="block h-full w-full"
                style={{ objectFit: "contain" }}
              >
                <source src={WEBM} type="video/webm" />
                <source src={MP4_FALLBACK} type="video/mp4" />
              </video>
            </div>
          </div>

          <div
            role="progressbar"
            aria-label="Carregando"
            aria-valuenow={p}
            aria-valuemin={0}
            aria-valuemax={100}
            className="relative w-full overflow-hidden"
            style={{ height: 2, background: TRILHA }}
          >
            <div
              className="absolute inset-y-0 left-0"
              style={{
                width: `${progresso}%`,
                background: INK,
                transition: semMovimento
                  ? "none"
                  : "width 420ms cubic-bezier(0.33, 1, 0.68, 1)",
              }}
            />
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-[13px]" style={{ color: MUTED }}>
              {statusPara(p)}
            </span>
            <span
              className="text-[13px]"
              style={{ color: INK, fontVariantNumeric: "tabular-nums" }}
            >
              {p}%
            </span>
          </div>
        </div>

        <p
          className="mt-8 text-center font-light"
          style={{
            fontSize: "clamp(20px, 2.4vw, 28px)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: INK,
          }}
        >
          Preparando uma história inesquecível
        </p>
      </div>
    </div>
  );
}
