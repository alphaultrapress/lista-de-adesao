"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { MediaSlot } from "@/lib/landingMedia";

type Tone = "light" | "dark";

interface MediaFrameProps {
  slot: MediaSlot;
  /** Fundo em que o quadro está apoiado — define o contraste do placeholder. */
  tone?: Tone;
  className?: string;
  style?: CSSProperties;
  /** Só para o herói: carrega cedo e dá play em loop mudo. */
  priority?: boolean;
  /** Largura que o quadro ocupa, para o Next escolher a versão certa. */
  sizes?: string;
}

// Enquanto a mídia não existe, o quadro mostra o tamanho exato do arquivo
// esperado. É o "molde" que a Amanda usa para produzir as peças novas.
function Placeholder({ slot, tone }: { slot: MediaSlot; tone: Tone }) {
  const dark = tone === "dark";
  const fg = dark ? "#ffffff" : "#000000";

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center"
      style={{
        background: dark ? "#0a0a0a" : "#f2f2f2",
        boxShadow: `inset 0 0 0 1px ${dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)"}`,
      }}
    >
      {/* Cruz de enquadramento — marca o centro da peça */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px), linear-gradient(90deg, ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          backgroundPosition: "center",
        }}
      />

      <span
        className="relative text-[9px] font-normal uppercase"
        style={{ letterSpacing: "0.28em", color: dark ? "#898989" : "#898989" }}
      >
        {slot.kind === "video" ? "Vídeo" : "Imagem"}
      </span>

      <span
        className="relative font-light leading-none"
        style={{
          color: fg,
          fontSize: "clamp(18px, 4.5cqw, 40px)",
          letterSpacing: "-0.05em",
        }}
      >
        {slot.width} &times; {slot.height}
      </span>

      <span
        className="relative text-[10px] font-normal uppercase"
        style={{ letterSpacing: "0.2em", color: dark ? "#898989" : "#898989" }}
      >
        {slot.ratio} &middot;{" "}
        {slot.format ?? (slot.kind === "video" ? "MP4" : "JPG")}
      </span>

      <span
        className="relative mt-1 max-w-full truncate px-2 py-1 text-[10px]"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          color: dark ? "#ffffff" : "#000000",
          background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          letterSpacing: "-0.001em",
        }}
      >
        {slot.src}
      </span>

      <span
        className="relative text-[10px]"
        style={{ color: "#898989", letterSpacing: "-0.01em" }}
      >
        {slot.label}
      </span>
    </div>
  );
}

export default function MediaFrame({
  slot,
  tone = "light",
  className,
  style,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: MediaFrameProps) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      // `containerType` deixa o texto do placeholder escalar com a largura do
      // quadro (cqw), então o tamanho continua legível em card pequeno.
      style={{ containerType: "inline-size", ...style }}
    >
      {!slot.ready ? (
        <Placeholder slot={slot} tone={tone} />
      ) : slot.kind === "video" ? (
        <video
          src={slot.src}
          autoPlay
          muted
          loop
          playsInline
          preload={priority ? "auto" : "metadata"}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Image
          src={slot.src}
          alt={slot.label}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      )}
    </div>
  );
}
