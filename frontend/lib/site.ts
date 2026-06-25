// =====================================================================
// CONFIG DE SITE — URL base e assets de marca para metadados / share.
// ---------------------------------------------------------------------
// O Open Graph e o WhatsApp exigem URLs ABSOLUTAS (https://...).
// A origem vem de NEXT_PUBLIC_APP_URL; em produção, aponte essa env
// para o domínio real (ex.: https://lista-de-adesao.vercel.app).
// =====================================================================

/** Origem absoluta do site, sem barra final. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

/** Vídeo promocional usado no preview/OG. Caminho público absoluto. */
export const PROMO_VIDEO_PATH = "/Videos/video-home.mp4";

/** Imagem de capa (1200x630) usada como og:image dos links de adesão. */
export const OG_IMAGE_PATH = "/images/og-adesao.jpg";

/** Monta uma URL absoluta a partir de um caminho público (ex.: "/x.jpg"). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}/${path.replace(/^\/+/, "")}`;
}

/** URL pública da página de adesão de uma turma, a partir do slug. */
export function buildAdesaoUrl(slug: string): string {
  return `${SITE_URL}/adesao/${slug}`;
}
