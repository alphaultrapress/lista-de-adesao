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
      title="Seu link de adesão"
      subtitle="Compartilhe com os colegas da sua turma."
    >
      <div className="grid md:grid-cols-[1fr,auto] gap-8 items-center">
        <div className="space-y-5">
          <div className="hairline border-premium-dark3 bg-premium-black px-4 py-3 text-sm text-premium-light2 break-all font-mono">
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
              <Button variant="gold" type="button">
                Compartilhar no WhatsApp
              </Button>
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 mx-auto md:mx-0">
          <div className="p-3 bg-premium-white">
            <QRCodeCanvas
              value={url}
              size={140}
              bgColor="#F5F5F0"
              fgColor="#0A0A0A"
              level="M"
            />
          </div>
          <p className="text-[10px] tracking-premium-wide uppercase text-premium-light1">
            QR Code da turma
          </p>
        </div>
      </div>
    </Card>
  );
}
