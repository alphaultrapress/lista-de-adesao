/**
 * Paleta da área administrativa.
 *
 * Fica isolada do tailwind.config de propósito: a landing e o painel têm
 * identidades diferentes, e trocar tokens globais faria uma sangrar na outra.
 */
export const ADM = {
  bg: "#F5F5F3",
  surface: "#FFFFFF",
  sidebar: "#151614",
  sidebarAlt: "#1D1E1B",
  text: "#171816",
  textMuted: "#6F716B",
  border: "#E3E4DF",
  ink: "#111210",
  success: "#237A4B",
  warning: "#A26719",
  danger: "#B4232D",
  /** Vermelho Alpha: só detalhe pequeno de identidade. */
  alpha: "#C41230",
} as const;

export const SIDEBAR_W = 264;
export const SIDEBAR_W_COLLAPSED = 76;
export const HEADER_H = 72;
/** Dentro da faixa de 220–280ms pedida na especificação. */
export const SIDEBAR_MS = 240;

export const RADIUS = 10;
