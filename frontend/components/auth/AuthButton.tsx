"use client";

import { useState, type ButtonHTMLAttributes } from "react";
import { AUTH } from "./tokens";

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  /** Texto exibido enquanto carrega, no lugar do rótulo. */
  loadingLabel?: string;
  children: React.ReactNode;
}

/**
 * Botão principal preto.
 *
 * Sem gradiente, glow ou vermelho: o relevo vem de um filete interno claro no
 * topo e de uma sombra difusa. A largura não muda no estado de carregando —
 * só a seta dá lugar ao indicador.
 */
export default function AuthButton({
  loading = false,
  loadingLabel = "Enviando...",
  children,
  disabled,
  style,
  className,
  ...rest
}: AuthButtonProps) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const inativo = loading || disabled;

  return (
    <button
      type="button"
      disabled={inativo}
      aria-busy={loading}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      // className do chamador entra somado, não substituindo o estilo base.
      className={`relative flex w-full items-center justify-center gap-2 overflow-hidden ${className ?? ""}`}
      style={{
        height: 54,
        borderRadius: 10,
        background: hover && !inativo ? AUTH.inkHover : AUTH.ink,
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "0.02em",
        cursor: inativo ? "default" : "pointer",
        opacity: disabled && !loading ? 0.55 : 1,
        transform: pressed
          ? "translateY(0) scale(0.99)"
          : hover && !inativo
            ? "translateY(-1px)"
            : "translateY(0)",
        boxShadow:
          hover && !inativo
            ? "0 14px 38px rgba(0,0,0,0.26)"
            : "0 10px 30px rgba(0,0,0,0.20)",
        transition:
          "background 260ms ease, transform 260ms cubic-bezier(0.22,1,0.36,1), box-shadow 260ms ease",
        ...style,
      }}
      {...rest}
    >
      {/* Filete interno claro no topo — o único relevo do botão. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "rgba(255,255,255,0.16)" }}
      />

      <span>{loading ? loadingLabel : children}</span>

      {loading ? (
        <span
          aria-hidden
          className="inline-block h-[14px] w-[14px] animate-spin rounded-full"
          style={{
            border: "1.5px solid rgba(255,255,255,0.30)",
            borderTopColor: "#FFFFFF",
          }}
        />
      ) : (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          style={{
            transform: hover ? "translateX(4px)" : "translateX(0)",
            transition: "transform 260ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <path
            d="M5 12h13M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

/** Ação secundária clara, usada dentro do painel escuro. */
export function AuthGhostButton({
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      // className do chamador entra somado, não substituindo o estilo base.
      className={`inline-flex items-center gap-2 border px-6 text-[13px] font-medium transition-colors duration-300 ${className ?? ""}`}
      style={{
        height: 46,
        borderRadius: 10,
        borderColor: "rgba(255,255,255,0.28)",
        color: "#FAF9F6",
        letterSpacing: "0.02em",
        background: "transparent",
      }}
      onPointerEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.48)";
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
