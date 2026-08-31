"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { buildWhatsAppShareUrl } from "@/lib/share";
import { registrarEnvio } from "@/lib/rastreio";

const REMINDER_INTERVAL_MS = 5 * 60 * 1000;

interface Props {
  active: boolean;
  /** Só para o rastreio: marca de qual turma partiu o envio do link. */
  representativeId: string;
  adesaoUrl: string;
  nome: string;
  curso: string;
  instituicao: string;
}

export default function DashboardShareReminder({
  active,
  representativeId,
  adesaoUrl,
  nome,
  curso,
  instituicao,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!active) {
      setIsOpen(false);
      return;
    }

    const showReminder = () => {
      if (document.visibilityState === "visible") {
        setIsOpen(true);
      }
    };

    const reminderId = window.setInterval(showReminder, REMINDER_INTERVAL_MS);
    return () => window.clearInterval(reminderId);
  }, [active]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const whatsappUrl = buildWhatsAppShareUrl({
    nomeUsuario: nome,
    curso,
    instituicao,
    linkAdesao: adesaoUrl,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[170] flex items-center justify-center bg-[#111210]/70 p-4 backdrop-blur-sm sm:p-6"
      onClick={() => setIsOpen(false)}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-reminder-title"
        className="relative grid max-h-[92svh] w-full max-w-[900px] overflow-y-auto rounded-[24px] border border-[#D8D4CC] bg-[#FAF9F6] shadow-[0_28px_72px_rgba(17,18,16,0.35)] md:max-h-[min(92svh,650px)] md:grid-cols-[minmax(265px,0.84fr)_minmax(0,1fr)] md:overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Fechar lembrete"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-[#FAF9F6]/90 text-[#6F6D68] shadow-sm transition-colors hover:bg-[#FAF9F6] hover:text-[#111210]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="flex items-center justify-center bg-[#151612] p-3 sm:p-4">
          <Image
            src="/social-proof/pop-up.png"
            alt="Representante, amplie sua lista de interesse"
            width={1003}
            height={1568}
            unoptimized
            className="h-auto max-h-[44svh] w-auto max-w-full rounded-[14px] object-contain shadow-[0_14px_34px_rgba(0,0,0,0.35)] md:max-h-[610px]"
          />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0A7D3A]">
            A lista continua aberta
          </p>
          <h2
            id="share-reminder-title"
            className="mt-3 max-w-[420px] text-[32px] font-light leading-[0.98] tracking-[-0.045em] text-[#111210] sm:text-[38px]"
          >
            Convide mais pessoas da sua turma
          </h2>
          <p className="mt-5 max-w-[430px] text-sm leading-6 text-[#5D5B56] sm:text-[15px]">
            A meta inicial já foi alcançada. Enquanto a equipe Alpha entra em
            contato, compartilhe o link com quem ainda não entrou na lista.
          </p>
          <p className="mt-3 max-w-[430px] text-sm leading-6 text-[#5D5B56] sm:text-[15px]">
            Cada nova adesão fortalece a negociação da turma e ajuda a buscar
            melhores condições para todos.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                registrarEnvio(representativeId, "envio_whatsapp");
                setIsOpen(false);
              }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] bg-[#111210] px-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-transform hover:-translate-y-0.5 hover:bg-[#252621]"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#25D366" aria-hidden>
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
              </svg>
              Compartilhar no WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-12 rounded-[11px] px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F6D68] transition-colors hover:text-[#111210]"
            >
              Agora não
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
