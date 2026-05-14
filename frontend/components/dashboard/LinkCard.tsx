"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import Card from "../ui/Card";
import Button from "../ui/Button";

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

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no-op */
    }
  }

  const waText = encodeURIComponent(
    `Olá! Sou ${nome}, de ${curso} - ${instituicao}. Demonstre seu interesse nos convites de formatura da nossa turma aqui, sem compromisso: ${url}`,
  );

  return (
    <Card
      title="Link da turma"
      subtitle="Compartilhe este link com os colegas da sua turma."
    >
      <div className="grid items-center gap-8 md:grid-cols-[1fr,auto]">
        <div className="space-y-5">
          <div className="break-all border border-line bg-white/70 px-4 py-3 font-mono text-sm text-text-secondary shadow-[0_1px_0_rgba(255,255,255,0.72)_inset]">
            {url}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={copy}>
              {copied ? "Link copiado" : "Copiar link"}
            </Button>
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="primary" type="button">
                Compartilhar
              </Button>
            </a>
          </div>
        </div>

        <div className="mx-auto flex flex-col items-center gap-3 md:mx-0">
          <div className="border border-line bg-white/80 p-4 shadow-[0_24px_42px_-34px_rgba(10,10,10,0.42)]">
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
        </div>
      </div>
    </Card>
  );
}
