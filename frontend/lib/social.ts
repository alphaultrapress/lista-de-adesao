// =====================================================================
// LINKS SOCIAIS / EXTERNOS — fonte única de verdade
// ---------------------------------------------------------------------
// Para trocar um link, edite apenas este arquivo.
// Se um link ainda não existir, deixe `null` — os botões que dependem
// dele simplesmente não renderizam (sem links falsos / quebrados).
// =====================================================================

export type SocialLinks = {
  instagram: string | null;
  tiktok: string | null;
  /**
   * URL para a página/catálogo de modelos.
   * Hoje aponta para o Instagram (decisão de produto enquanto não há
   * catálogo dedicado). Trocar aqui quando existir página própria.
   */
  modelos: string | null;
  /** Handle do Instagram exibido em UI (sem o @ inicial). */
  instagramHandle: string;
};

export const SOCIAL: SocialLinks = {
  instagram: "https://www.instagram.com/alphaconvites/",
  tiktok: "https://www.tiktok.com/@alphaconvites",
  modelos: "https://www.instagram.com/alphaconvites/",
  instagramHandle: "alphaconvites",
};
