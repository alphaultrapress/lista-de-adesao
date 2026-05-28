// Renderiza um cartao editorial premium 1080x1350 com QR code centralizado.
// Usado tanto pelo dashboard do representante quanto pelo painel admin.

export type QrPosterParams = {
  qrCanvas: HTMLCanvasElement;
  curso: string;
  instituicao: string;
  url: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildQrPosterBlob(
  params: QrPosterParams,
): Promise<Blob | null> {
  const { qrCanvas, curso, instituicao, url } = params;

  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const GOLD = "#B8923E";
  const GOLD_DARK = "#8B6B3A";
  const WINE = "#8E0A22";
  const INK = "#1A1410";

  // === FUNDO ===
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#FAF7F2");
  bg.addColorStop(0.55, "#F5F0E8");
  bg.addColorStop(1, "#ECE4D6");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const halo = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  halo.addColorStop(0, "rgba(212,175,110,0.18)");
  halo.addColorStop(0.6, "rgba(212,175,110,0.05)");
  halo.addColorStop(1, "rgba(212,175,110,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // Moldura dupla
  ctx.strokeStyle = "rgba(184,146,62,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = "rgba(184,146,62,0.2)";
  ctx.strokeRect(54, 54, W - 108, H - 108);

  let y = 130;

  // LOGO
  try {
    const logo = await loadImage("/logos/logo-dark.png");
    const logoH = 160;
    const logoW = (logo.width / logo.height) * logoH;
    ctx.drawImage(logo, (W - logoW) / 2, y, logoW, logoH);
    y += logoH + 50;
  } catch {
    ctx.fillStyle = "#0A0805";
    ctx.font = 'italic 56px Georgia, serif';
    ctx.textAlign = "center";
    ctx.fillText("alpha", W / 2, y + 60);
    y += 130;
  }

  // ORNAMENTO
  const ornY = y;
  const gradL = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 - 35, 0);
  gradL.addColorStop(0, "rgba(184,146,62,0)");
  gradL.addColorStop(1, "rgba(184,146,62,0.7)");
  ctx.fillStyle = gradL;
  ctx.fillRect(W / 2 - 200, ornY - 1, 165, 1.5);

  ctx.save();
  ctx.translate(W / 2, ornY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = GOLD;
  ctx.fillRect(-7, -7, 14, 14);
  ctx.restore();

  const gradR = ctx.createLinearGradient(W / 2 + 35, 0, W / 2 + 200, 0);
  gradR.addColorStop(0, "rgba(184,146,62,0.7)");
  gradR.addColorStop(1, "rgba(184,146,62,0)");
  ctx.fillStyle = gradR;
  ctx.fillRect(W / 2 + 35, ornY - 1, 165, 1.5);

  y += 55;

  // EYEBROW
  ctx.fillStyle = GOLD_DARK;
  ctx.font = '600 22px "Inter", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("L I S T A   D E   A D E S Ã O", W / 2, y);
  y += 80;

  // TÍTULO
  ctx.fillStyle = WINE;
  ctx.textAlign = "center";
  let titleFontSize = 70;
  const titleText = `Turma de ${curso}`;
  let titleLines: string[] = [];
  while (titleFontSize >= 38) {
    ctx.font = `italic 600 ${titleFontSize}px "Cormorant Garamond", Georgia, serif`;
    titleLines = wrapText(ctx, titleText, W - 220);
    if (titleLines.length <= 2) break;
    titleFontSize -= 6;
  }
  const titleLineHeight = titleFontSize * 1.08;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, y + i * titleLineHeight);
  });
  y += titleLines.length * titleLineHeight + 28;

  // INSTITUIÇÃO
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  let instFontSize = 20;
  let instLines: string[] = [];
  while (instFontSize >= 14) {
    ctx.font = `600 ${instFontSize}px "Inter", system-ui, sans-serif`;
    instLines = wrapText(ctx, instituicao.toUpperCase(), W - 260);
    if (instLines.length <= 2) break;
    instFontSize -= 2;
  }
  const instLineHeight = instFontSize * 1.45;
  instLines.forEach((line, i) => {
    ctx.fillText(line, W / 2, y + i * instLineHeight);
  });
  y += instLines.length * instLineHeight + 60;

  // CARD DO QR
  const footerHeight = 220;
  const availableForCard = H - y - footerHeight - 40;
  const cardSize = Math.min(640, availableForCard);
  const cardPad = Math.max(28, Math.round(cardSize * 0.07));
  const qrSize = cardSize - cardPad * 2;
  const cardX = (W - cardSize) / 2;
  const cardY = y;

  ctx.save();
  ctx.shadowColor = "rgba(20,15,10,0.18)";
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(cardX, cardY, cardSize, cardSize);
  ctx.restore();

  ctx.strokeStyle = "rgba(184,146,62,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(cardX, cardY, cardSize, cardSize);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrCanvas, cardX + cardPad, cardY + cardPad, qrSize, qrSize);
  ctx.imageSmoothingEnabled = true;

  // CANTOS EM L
  const cornerSize = 30;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  const corners = [
    { x: cardX, y: cardY, sx: 1, sy: 1 },
    { x: cardX + cardSize, y: cardY, sx: -1, sy: 1 },
    { x: cardX, y: cardY + cardSize, sx: 1, sy: -1 },
    { x: cardX + cardSize, y: cardY + cardSize, sx: -1, sy: -1 },
  ];
  corners.forEach(({ x, y: cy, sx, sy }) => {
    ctx.beginPath();
    ctx.moveTo(x + sx * cornerSize, cy);
    ctx.lineTo(x, cy);
    ctx.lineTo(x, cy + sy * cornerSize);
    ctx.stroke();
  });

  y = cardY + cardSize + 60;

  // CTA
  ctx.fillStyle = INK;
  ctx.font = '600 22px "Inter", system-ui, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("A P O N T E   A   C Â M E R A   D O   C E L U L A R", W / 2, y);
  y += 42;

  // LINK
  let cleanUrl = url.replace(/^https?:\/\//, "");
  ctx.fillStyle = "#3A2A1F";
  ctx.font = '500 19px "JetBrains Mono", "Courier New", monospace';
  while (ctx.measureText(cleanUrl).width > W - 160 && cleanUrl.length > 30) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  if (cleanUrl !== url.replace(/^https?:\/\//, "")) {
    cleanUrl = cleanUrl.slice(0, -1) + "…";
  }
  ctx.fillText(cleanUrl, W / 2, y);

  // RODAPÉ
  ctx.fillStyle = GOLD_DARK;
  ctx.font = 'italic 300 24px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = "center";
  ctx.fillText("Convites premium · +50 anos de tradição", W / 2, H - 90);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 1);
  });
}

export function slugifyFile(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
