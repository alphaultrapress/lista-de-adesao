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
    `Olá! Sou ${nome}, de ${curso} - ${instituicao}. Preencha sua adesão dos convites de formatura aqui: ${url}`,
  );

  return (
    <Card
      title="Link da turma"
      subtitle="Compartilhe este link com os colegas da sua turma."
    >
      <div className="grid md:grid-cols-[1fr,auto] gap-8 items-center">
        <div className="space-y-5">
          <div className="border border-line bg-bg px-4 py-3 text-sm text-text-secondary break-all font-mono">
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

        <div className="flex flex-col items-center gap-3 mx-auto md:mx-0">
          <div className="p-4 border border-line bg-bg">
            <QRCodeCanvas
              value={url}
              size={132}
              bgColor="#F8F8F5"
              fgColor="#0A0A0A"
              level="M"
            />
          </div>
          <p className="text-[10px] tracking-premium-widest uppercase text-text-tertiary">
            QR Code da turma
          </p>
        </div>
      </div>
    </Card>
  );
}
