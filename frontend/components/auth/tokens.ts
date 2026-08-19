/**
 * Paleta e medidas da tela de autenticação.
 *
 * Vive isolada aqui — e não no tailwind.config — para que a repaginação do
 * login não vaze para o resto do sistema.
 */
export const AUTH = {
  offWhite: "#F4F1EB",
  warmWhite: "#FAF9F6",
  fieldBg: "#F8F7F3",
  ink: "#111210",
  graphite: "#181917",
  /** Painel: preto de laca, mais fundo que o grafite para o reflexo aparecer. */
  panel: "#0F100E",
  inkHover: "#242522",
  textMuted: "#6F6D68",
  border: "#D8D4CC",
  /** Vermelho Alpha: só filete curto e estado de erro. */
  alphaRed: "#C41230",
  /** Traço claro sobre o grafite — mesma regra da borda do card. */
  hairline: "rgba(255,255,255,0.10)",
} as const;

/** Easing e duração pedidos na especificação da troca de estado. */
export const SWAP_EASE = [0.76, 0, 0.24, 1] as const;
export const SWAP_DURATION = 0.8;

/** Fatia da largura do card ocupada pelo painel visual. */
export const PANEL_W = 54;
/** Fatia ocupada pelo formulário. As duas somam mais de 100 por causa da diagonal. */
export const FORM_W = 100 - PANEL_W;

/**
 * Recuo da diagonal, em % da largura do painel.
 *
 * É o quanto o clip-path come da aresta inclinada no topo. O conteúdo do painel
 * usa este mesmo número para calcular o padding do lado da diagonal — foi por
 * não amarrar os dois que o texto vinha sendo cortado.
 */
export const DIAGONAL_INSET = 10;
/** Respiro entre a aresta inclinada e o texto. */
export const DIAGONAL_PAD = 44;
