// =====================================================================
// COMPARTILHAMENTO VIA WHATSAPP — fonte única do copy e da URL de share.
// ---------------------------------------------------------------------
// O texto é DINÂMICO: cada representante gera sua própria mensagem com
// os dados da turma dele. O link de adesão leva o destinatário à página
// pública (que tem Open Graph dinâmico: título + thumbnail por turma),
// então o WhatsApp já renderiza um card de preview elegante a partir
// desse único link — sem precisar colar o .mp4 cru na mensagem.
// =====================================================================

export type WhatsAppShareData = {
  /** Nome do representante (ex.: "MATHEUS CHIRIANO"). */
  nomeUsuario: string;
  /** Curso da turma (ex.: "ADMINISTRAÇÃO"). */
  curso: string;
  /** Instituição (ex.: "UENP - UNIVERSIDADE ESTADUAL DO NORTE DO PARANÁ"). */
  instituicao: string;
  /** Link público de adesão da turma (absoluto, https://...). */
  linkAdesao: string;
  /**
   * Link do vídeo promocional. Opcional — por padrão NÃO entra na
   * mensagem, porque o WhatsApp gera o preview a partir do linkAdesao
   * e um segundo link de .mp4 cru polui o card. Passe quando quiser
   * incluí-lo explicitamente no texto.
   */
  linkVideo?: string;
};

/** Primeiro nome em Capitalizado, para um copy mais humano. */
function primeiroNome(nomeCompleto: string): string {
  const first = nomeCompleto.trim().split(/\s+/)[0] ?? "";
  if (!first) return "";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

/**
 * Monta o texto (ainda NÃO codificado) da mensagem de compartilhamento.
 * Copy enxuto, com quebras de linha organizadas — padrão fintech premium.
 */
export function buildWhatsAppShareText({
  nomeUsuario,
  curso,
  instituicao,
  linkAdesao,
  linkVideo,
}: WhatsAppShareData): string {
  const nome = primeiroNome(nomeUsuario) || nomeUsuario;

  const linhas = [
    `Olá! Aqui é ${nome}, da turma de ${curso} da ${instituicao}.`,
    ``,
    `Estamos organizando os convites de formatura da nossa turma com a Alpha Convites e queremos contar com você. Demonstre seu interesse aqui, sem compromisso:`,
    linkAdesao,
  ];

  if (linkVideo) {
    linhas.push(
      ``,
      `Assista ao vídeo e veja como nossos convites premium ficam incríveis:`,
      linkVideo,
    );
  }

  return linhas.join("\n");
}

/**
 * Monta a URL final de compartilhamento do WhatsApp (wa.me) já com o
 * texto codificado via encodeURIComponent.
 */
export function buildWhatsAppShareUrl(data: WhatsAppShareData): string {
  const text = buildWhatsAppShareText(data);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Abre o WhatsApp com a mensagem pronta. Use no onClick do botão.
 * Funciona para QUALQUER representante: basta passar os dados da sessão
 * dele. Retorna a URL gerada (útil para testes / fallback de href).
 */
export function handleShareWhatsApp(data: WhatsAppShareData): string {
  const url = buildWhatsAppShareUrl(data);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return url;
}
