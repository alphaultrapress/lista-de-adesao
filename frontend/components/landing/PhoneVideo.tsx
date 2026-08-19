"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Celular com vídeo dentro.

   O PNG do aparelho tem a tela vazada e fica POR CIMA do vídeo, então nada
   escapa da moldura. O arquivo já vem recortado no contorno do aparelho, e as
   medidas da tela abaixo foram tiradas do canal alfa dele por inundação a
   partir da borda — o que sobra de transparente no meio é exatamente a tela.

   A caixa do vídeo é de propósito um pouco MAIOR que a tela medida: a sobra
   cai sobre a moldura opaca, que a esconde. Uma caixa menor deixaria aparecer
   o fundo da página dentro do celular.
   ────────────────────────────────────────────────────────────────────────── */

const MOCKUP = "/landing/mockup/video-frame.png";
const VIDEO = "/Videos/video-como-comprar1.mp4";

/** Proporção do arquivo recortado (822×1600), para não causar CLS. */
const MOCKUP_W = 822;
const MOCKUP_H = 1600;

/**
 * Tela medida: L 6.59% · T 2.85% · W 87.25% · H 94.70%.
 * Aqui vai meio ponto de folga para cada lado, coberto pela moldura.
 */
const TELA = { left: "6.1%", top: "2.3%", width: "88.2%", height: "95.8%" };

export default function PhoneVideo({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [pausado, setPausado] = useState(false);
  const [mudo, setMudo] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Com movimento reduzido o vídeo começa parado, no primeiro quadro.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      setPausado(true);
    }
  }, []);

  function alternar() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      // O clique é um gesto do usuário, então aqui o som pode ser ligado —
      // o autoplay inicial precisa continuar mudo por regra do navegador.
      v.muted = false;
      setMudo(false);
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={pausado ? "Reproduzir o vídeo com som" : "Pausar o vídeo"}
      className={`group relative block cursor-pointer border-0 bg-transparent p-0 ${className ?? ""}`}
      style={{ aspectRatio: `${MOCKUP_W} / ${MOCKUP_H}` }}
    >
      {/* vídeo — atrás, preso à área da tela.
          O fundo preto é obrigatório: com o vídeo menor que a tela, sem ele o
          fundo da página apareceria por dentro do celular. */}
      <span
        className="absolute overflow-hidden"
        style={{ ...TELA, background: "#000000" }}
      >
        <video
          ref={videoRef}
          src={VIDEO}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onPlay={() => setPausado(false)}
          onPause={() => setPausado(true)}
          onVolumeChange={(e) => setMudo(e.currentTarget.muted)}
          className="h-full w-full"
          // `contain` mostra o vídeo inteiro, sem corte e sem esticar. Como a
          // tela é 16% mais estreita que o vídeo, ele encosta nas laterais e
          // sobra uma faixa preta em cima e embaixo — como num player.
          style={{ objectFit: "contain", display: "block" }}
        />
      </span>

      {/* moldura — na frente, mascarando qualquer sobra do vídeo */}
      <Image
        src={MOCKUP}
        alt=""
        aria-hidden
        fill
        sizes="(max-width: 1024px) 60vw, 30vw"
        className="pointer-events-none select-none"
        style={{ objectFit: "contain" }}
      />

      {/* controle: sempre visível quando pausado, só no hover quando tocando */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          pausado ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/50 bg-black/30 backdrop-blur-[2px]">
          {pausado ? (
            <svg viewBox="0 0 24 24" className="ml-[3px] h-6 w-6 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          )}
        </span>
      </span>

      {/* aviso de mudo: some assim que o som é ligado no primeiro clique */}
      {mudo && !pausado && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-[6%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-3 py-1 text-[11px] text-white backdrop-blur-[2px]"
        >
          Toque para ouvir
        </span>
      )}
    </button>
  );
}
