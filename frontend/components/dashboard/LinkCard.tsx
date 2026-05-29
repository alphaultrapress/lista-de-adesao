"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { buildQrPosterBlob, slugifyFile } from "@/lib/qrPoster";

interface LinkCardProps {
  url: string;
  nome: string;
  curso: string;
  instituicao: string;
}

export default function LinkCard({
  url,
  nome,
  curso,
  instituicao,
}: LinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrFeedback, setQrFeedback] = useState<string | null>(null);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op */
    }
  }

  function getQrCanvas(): HTMLCanvasElement | null {
    return qrWrapperRef.current?.querySelector("canvas") ?? null;
  }

  function flashFeedback(msg: string) {
    setQrFeedback(msg);
    setTimeout(() => setQrFeedback(null), 2200);
  }

  async function buildPremiumQrImage(): Promise<Blob | null> {
    const qrCanvas = getQrCanvas();
    if (!qrCanvas) return null;
    return buildQrPosterBlob({ qrCanvas, curso, instituicao, url });
  }

  async function downloadQr() {
    const blob = await buildPremiumQrImage();
    if (!blob) return;
    const filename = `convite-${slugifyFile(curso)}-${slugifyFile(instituicao)}.png`;
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
    flashFeedback("Imagem baixada");
  }

  async function shareQr() {
    const blob = await buildPremiumQrImage();
    if (!blob) return;

    const filename = `convite-${slugifyFile(curso)}-${slugifyFile(instituicao)}.png`;
    const file = new File([blob], filename, { type: "image/png" });

    const nav = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
    };

    // Web Share API com arquivo (mobile e Safari/Chrome desktop modernos)
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({
          files: [file],
          title: `Lista de adesão — ${curso}`,
          text: `Demonstre seu interesse nos convites de formatura: ${url}`,
        });
        return;
      } catch {
        // usuário cancelou ou falhou — cai no fallback
      }
    }

    // Fallback: copia imagem pro clipboard (Chrome/Edge desktop)
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      flashFeedback("Imagem copiada — cole onde quiser");
      return;
    } catch {
      await downloadQr();
      flashFeedback("Imagem baixada — anexe onde quiser");
    }
  }

  const waText = encodeURIComponent(
    `Olá! Sou ${nome}, de ${curso} - ${instituicao}. Demonstre seu interesse nos convites de formatura da nossa turma aqui, sem compromisso: ${url}`,
  );

  return (
    <Card
      title="Link da turma"
      subtitle="Compartilhe este link com os colegas para que eles possam registrar o interesse nos convites de formatura."
    >
      <div className="grid items-center gap-8 md:grid-cols-[1fr,auto]">
        <div className="space-y-5">
          <div className="break-all border border-line bg-white/70 px-4 py-3 font-mono text-sm text-text-secondary shadow-[0_1px_0_rgba(255,255,255,0.72)_inset]">
            {url}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={copy}>
              {copied ? "Link copiado" : "Copiar link"}
            </Button>
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Compartilhar no WhatsApp"
              className="inline-flex items-center gap-3 rounded-[4px] border border-line bg-white px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary transition-all duration-300 hover:border-[#25D366] hover:-translate-y-[1px]"
            >
              <svg width="45" height="45" viewBox="0 0 24 24" fill="#25D366">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
              </svg>
              Compartilhar no WhatsApp
            </a>
          </div>
        </div>

        <div className="mx-auto flex flex-col items-center gap-3 md:mx-0">
          <div
            ref={qrWrapperRef}
            className="border border-line bg-white/80 p-4 shadow-[0_24px_42px_-34px_rgba(10,10,10,0.42)]"
          >
            <QRCodeCanvas
              value={url}
              size={132}
              bgColor="#FFFFFF"
              fgColor="#0A0A0A"
              level="M"
            />
          </div>
          <p className="text-[10px] uppercase tracking-premium-widest text-text-tertiary">
            QR Code da turma
          </p>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={downloadQr}
              className="group inline-flex items-center gap-1.5 border border-line bg-white px-3 py-2 text-[10px] uppercase tracking-premium-widest text-text-secondary transition-all duration-300 hover:border-text-primary hover:text-text-primary"
              aria-label="Baixar QR Code como imagem"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-y-[1px]"
              >
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
              </svg>
              Baixar
            </button>

            <button
              type="button"
              onClick={shareQr}
              className="group inline-flex items-center gap-1.5 border border-line bg-white px-3 py-2 text-[10px] uppercase tracking-premium-widest text-text-secondary transition-all duration-300 hover:border-text-primary hover:text-text-primary"
              aria-label="Compartilhar QR Code como imagem"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:-translate-y-[1px]"
              >
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
              Compartilhar
            </button>
          </div>

          {qrFeedback && (
            <p className="mt-1 text-[10px] uppercase tracking-premium-widest text-[#0a7d3a]">
              {qrFeedback}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
