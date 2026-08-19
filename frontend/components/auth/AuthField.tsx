"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AUTH } from "./tokens";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Mensagem de erro. Reserva espaço fixo, então não empurra o layout. */
  error?: string;
  /** Ícone minimalista à direita (18px). */
  icon?: ReactNode;
  /** Ação à direita — usada pelo olho de mostrar/ocultar senha. */
  action?: ReactNode;
}

export default function AuthField({
  label,
  error,
  icon,
  action,
  id,
  className,
  ...rest
}: AuthFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [focado, setFocado] = useState(false);
  const semMovimento = useReducedMotion();

  const corBorda = error
    ? AUTH.alphaRed
    : focado
      ? AUTH.ink
      : AUTH.border;

  return (
    <div className={className}>
      {/* A label acompanha o foco no tom e num deslocamento mínimo. */}
      <motion.label
        htmlFor={fieldId}
        className="mb-2 block select-none text-[11px] font-medium uppercase"
        style={{ letterSpacing: "0.08em" }}
        animate={{
          color: error ? AUTH.alphaRed : focado ? AUTH.ink : AUTH.textMuted,
          x: semMovimento ? 0 : focado ? 2 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {label}
      </motion.label>

      <div className="relative">
        <input
          id={fieldId}
          onFocus={(e) => {
            setFocado(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            rest.onBlur?.(e);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-erro` : undefined}
          className="w-full appearance-none bg-transparent text-[15px] outline-none placeholder:text-[#A8A49B]"
          style={{
            height: 54,
            borderRadius: 10,
            border: `1px solid ${corBorda}`,
            background: AUTH.fieldBg,
            color: AUTH.ink,
            padding: icon || action ? "0 46px 0 16px" : "0 16px",
            // O foco vem de borda + halo suave, sem brilho colorido.
            boxShadow: focado
              ? `0 0 0 3px rgba(17,18,16,0.10)`
              : "0 1px 0 rgba(17,18,16,0.02)",
            transition:
              "border-color 220ms ease, box-shadow 220ms ease, background 220ms ease",
          }}
          {...rest}
        />

        {(action || icon) && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: AUTH.textMuted }}
          >
            {action ?? icon}
          </span>
        )}
      </div>

      {/* Altura reservada: a mensagem aparece sem deslocar o campo de baixo. */}
      <div className="min-h-[18px] pt-1">
        {error && (
          <motion.p
            id={`${fieldId}-erro`}
            role="alert"
            initial={semMovimento ? false : { opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="text-[12px]"
            style={{ color: AUTH.alphaRed }}
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  );
}

/** Olho de mostrar/ocultar senha. */
export function EyeToggle({
  visivel,
  onToggle,
}: {
  visivel: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
      className="flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-200 hover:text-[#111210]"
      style={{ color: "inherit" }}
    >
      {visivel ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
          <path
            d="M3 3l18 18M10.6 10.7a2 2 0 002.8 2.8M9.4 5.3A9.6 9.6 0 0112 5c5 0 9 4.5 9 7 0 .8-.9 2.2-2.4 3.5M6.3 7.6C4.1 9 3 10.6 3 12c0 2.5 4 7 9 7 1 0 1.9-.2 2.8-.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
          <path
            d="M3 12s3.6-7 9-7 9 7 9 7-3.6 7-9 7-9-7-9-7z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      )}
    </button>
  );
}
