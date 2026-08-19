// Catálogo de mídias da landing page.
//
// Enquanto `ready: false`, o quadro aparece na tela como placeholder mostrando
// o tamanho exato que o arquivo precisa ter. Para publicar uma mídia:
//   1. salve o arquivo em `frontend/public` + o caminho de `src`;
//   2. troque `ready` para `true`.
// Nada mais precisa mudar — o componente <MediaFrame> troca sozinho.

export type MediaSlot = {
  /** Caminho público onde o arquivo deve ser salvo. */
  src: string;
  kind: "image" | "video";
  /** Tamanho ideal em pixels do arquivo entregue. */
  width: number;
  height: number;
  /** Proporção legível, exibida no placeholder. */
  ratio: string;
  /** O que entra nesse quadro (aparece no placeholder). */
  label: string;
  /** Extensão esperada. Só para o placeholder avisar; o padrão é JPG. */
  format?: string;
  ready: boolean;
};

/** Vídeo de fundo do herói — ocupa a tela inteira. */
export const HERO_VIDEO: MediaSlot = {
  src: "/landing/home.mp4",
  kind: "video",
  width: 1920,
  height: 1080,
  ratio: "16:9",
  label: "Vídeo do herói",
  ready: true,
};

/** Primeiro frame do vídeo — aparece enquanto o vídeo carrega. */
export const HERO_POSTER: MediaSlot = {
  src: "/landing/hero-poster.jpg",
  kind: "image",
  width: 1920,
  height: 1080,
  ratio: "16:9",
  label: "Poster do vídeo",
  ready: false,
};

/**
 * Carrossel que sobrepõe o rodapé do herói — corre de ponta a ponta da tela e
 * as peças das bordas ficam cortadas de propósito.
 * Pode ter mais ou menos itens: o carrossel se ajusta sozinho.
 */
export const HERO_TILES: MediaSlot[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  // Versões otimizadas de public/images/carrosel (11 MB de PNG → 969 KB).
  src: `/landing/carrossel/c-${n}.jpg`,
  kind: "image" as const,
  width: 1254,
  height: 1254,
  ratio: "1:1",
  label: `Carrossel ${n}`,
  ready: true,
}));

/**
 * Acabamentos — fotos de detalhe reais, já recortadas em 4:5 e otimizadas.
 * São sete, então a seção usa linha que quebra e centraliza a última fileira.
 */
export const ACABAMENTOS: { title: string; desc: string; slot: MediaSlot }[] = [
  { title: "Hot stamping", desc: "Aplicação metálica a quente, com brilho espelhado no papel.", arquivo: "hot-stamping" },
  { title: "Alto relevo", desc: "Volume real no papel. O nome da turma ganha textura.", arquivo: "alto-relevo" },
  { title: "Baixo relevo", desc: "Marcação afundada, percebida antes pelo toque que pelo olho.", arquivo: "baixo-relevo" },
  { title: "Corte especial", desc: "Recortes sob medida que mudam a silhueta do convite.", arquivo: "corte-especial" },
  { title: "Aplique 3V", desc: "Camadas sobrepostas que dão profundidade à capa.", arquivo: "aplique-3v" },
  { title: "Acrílico espelhado", desc: "Peça rígida com reflexo. É o acabamento mais pedido.", arquivo: "acrilico-espelhado" },
  { title: "Medalha latão oval", desc: "Medalha em latão aplicada como selo da turma.", arquivo: "medalha-latao-oval" },
].map(({ title, desc, arquivo }) => ({
  title,
  desc,
  slot: {
    src: `/landing/acabamentos/${arquivo}.jpg`,
    kind: "image" as const,
    width: 800,
    height: 1000,
    ratio: "4:5",
    label: title,
    ready: true,
  },
}));

/**
 * Mockups de celular do "Como funciona" — um por passo.
 * PNG com fundo transparente: o aparelho fica solto sobre o branco da seção.
 */
const MOCKUPS = [
  { arquivo: "esquerda", w: 546 },
  { arquivo: "centro", w: 614 },
  { arquivo: "centro-3", w: 614 },
  { arquivo: "direita", w: 546 },
] as const;

export const PASSO_MOCKUPS: MediaSlot[] = MOCKUPS.map((m, i) => ({
  src: `/landing/mockup/${m.arquivo}.png`,
  kind: "image" as const,
  width: m.w,
  height: 1200,
  ratio: "recortado",
  format: "PNG",
  label: `Mockup do passo ${i + 1}`,
  ready: true,
}));

/**
 * Os mesmos quatro passos vistos no desktop. Mesma distribuição dos de celular:
 * esquerda no 1, centro no 2 e 3, direita no 4.
 *
 * São deitados, enquanto os de celular são em pé — por isso o
 * quadro que os exibe encaixa por `contain`, e não por altura fixa.
 */
const MOCKUPS_DESKTOP = [
  { arquivo: "d-esquerda", w: 3644, h: 2448 },
  { arquivo: "d-centro", w: 3180, h: 2216 },
  { arquivo: "d-centro-3", w: 3180, h: 2216 },
  { arquivo: "d-direita", w: 3644, h: 2448 },
] as const;

export const PASSO_MOCKUPS_DESKTOP: MediaSlot[] = MOCKUPS_DESKTOP.map((m, i) => ({
  src: `/landing/mockup/${m.arquivo}.png`,
  kind: "image" as const,
  width: m.w,
  height: m.h,
  ratio: "recortado",
  format: "PNG",
  label: `Mockup desktop do passo ${i + 1}`,
  ready: true,
}));

/**
 * Mural da galeria — colunas que deslizam sobre fundo escuro.
 *
 * As dimensões são as reais de cada arquivo já otimizado, para o mural não
 * pular de altura enquanto as imagens carregam.
 */
export const GALERIA_MURAL: { src: string; w: number; h: number }[] = [
  { src: "/landing/galeria/g-01.jpg", w: 440, h: 248 },
  { src: "/landing/galeria/g-02.jpg", w: 440, h: 294 },
  { src: "/landing/galeria/g-03.jpg", w: 440, h: 294 },
  { src: "/landing/galeria/g-04.jpg", w: 440, h: 294 },
  { src: "/landing/galeria/g-05.jpg", w: 440, h: 294 },
  { src: "/landing/galeria/g-06.jpg", w: 440, h: 294 },
  { src: "/landing/galeria/g-07.jpg", w: 440, h: 550 },
  { src: "/landing/galeria/g-08.jpg", w: 440, h: 294 },
  { src: "/landing/galeria/g-09.jpg", w: 440, h: 294 },
  { src: "/landing/galeria/g-10.jpg", w: 440, h: 248 },
  { src: "/landing/galeria/g-11.jpg", w: 440, h: 248 },
  { src: "/landing/galeria/g-12.jpg", w: 440, h: 294 },
  { src: "/landing/galeria/g-13.jpg", w: 440, h: 294 },
  { src: "/landing/galeria/g-14.jpg", w: 440, h: 294 },
  { src: "/landing/galeria/g-15.jpg", w: 440, h: 294 },
  { src: "/landing/galeria/g-16.jpg", w: 440, h: 248 },
  { src: "/landing/galeria/g-17.jpg", w: 440, h: 248 },
  { src: "/landing/galeria/g-18.jpg", w: 440, h: 352 },
];

/** Fundo da faixa final de chamada. */
export const CTA_BG: MediaSlot = {
  src: "/landing/cta.jpg",
  kind: "image",
  width: 1920,
  height: 1080,
  ratio: "16:9",
  label: "Fundo da chamada final",
  ready: false,
};
