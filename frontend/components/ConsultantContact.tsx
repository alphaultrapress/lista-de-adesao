"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
  assignNextConsultant,
  buildConsultantWhatsAppUrl,
  Consultant,
  findConsultantByPhone,
  formatConsultantPhone,
  getStoredConsultant,
  storeConsultant,
} from "@/lib/consultants";
import { supabase } from "@/lib/supabase";

interface ConsultantContactProps {
  representativeId?: string;
  consultantName?: string | null;
  consultantPhone?: string | null;
  onAssigned?: (consultant: Consultant) => void;
}

export default function ConsultantContact({
  representativeId,
  consultantName,
  consultantPhone,
  onAssigned,
}: ConsultantContactProps) {
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const savedConsultant = findConsultantByPhone(consultantPhone);

    if (savedConsultant) {
      const withSavedName = {
        ...savedConsultant,
        name: consultantName || savedConsultant.name,
      };

      setConsultant(withSavedName);
      storeConsultant(withSavedName);
      return;
    }

    const localConsultant = getStoredConsultant();
    if (localConsultant) {
      setConsultant(localConsultant);
    }
  }, [consultantName, consultantPhone]);

  async function persistConsultant(nextConsultant: Consultant) {
    if (!representativeId) return;

    const { error } = await supabase
      .from("representatives")
      .update({
        consultant_name: nextConsultant.name,
        consultant_phone: nextConsultant.phone,
      })
      .eq("id", representativeId);

    if (!error) {
      onAssigned?.(nextConsultant);
    }
  }

  async function handleOpen() {
    const nextConsultant = consultant || assignNextConsultant();

    setConsultant(nextConsultant);
    storeConsultant(nextConsultant);
    setOpen(true);

    await persistConsultant(nextConsultant);
  }

  function handleClose() {
    setOpen(false);
  }

  const whatsAppUrl = consultant
    ? buildConsultantWhatsAppUrl(consultant)
    : undefined;

  return (
    <>
      <Button type="button" variant="light" onClick={handleOpen}>
        Falar com um consultor
      </Button>

      {open && consultant && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 px-5 py-8 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consultant-modal-title"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-md overflow-hidden border border-white/10 bg-[#090909] p-7 text-text-inverse shadow-[0_34px_90px_rgba(0,0,0,0.56)] md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 cta-grid opacity-60" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(130,0,0,0.22),transparent_45%)]" />

            <div className="relative">
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center border border-white/10 text-lg leading-none text-white/60 transition-colors duration-250 hover:text-white"
                aria-label="Fechar"
              >
                x
              </button>

              <span className="tech-eyebrow dark pr-12">
                <span className="dot" />
                Atendimento direto
              </span>
              <h2
                id="consultant-modal-title"
                className="mt-6 font-serif text-3xl tracking-premium-tight text-[#f5f5f5]"
              >
                Seu consultor Alpha
              </h2>

              <div className="mt-7 border border-white/10 bg-white/[0.03] p-5">
                <p className="text-[11px] uppercase tracking-premium-widest text-white/45">
                  Consultor atribuído
                </p>
                <p className="mt-3 text-lg font-medium tracking-premium-wide text-white">
                  {consultant.name}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {formatConsultantPhone(consultant.phone)}
                </p>
              </div>

              {whatsAppUrl && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center border border-white/80 bg-white px-7 py-3.5 text-[11px] uppercase tracking-premium-wide text-ink transition-all duration-450 ease-premium hover:bg-bg-soft"
                >
                  Conversar pelo WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
