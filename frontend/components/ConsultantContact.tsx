"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [selectedConsultant, setSelectedConsultant] =
    useState<Consultant | null>(null);
  const [isConsultantModalOpen, setIsConsultantModalOpen] = useState(false);
  const [isLoadingConsultant, setIsLoadingConsultant] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isAssigningRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const savedConsultant = findConsultantByPhone(consultantPhone);

    if (savedConsultant) {
      const withSavedName = {
        ...savedConsultant,
        name: consultantName || savedConsultant.name,
      };

      setSelectedConsultant(withSavedName);
      storeConsultant(withSavedName);
      return;
    }

    const localConsultant = getStoredConsultant();
    if (localConsultant) {
      setSelectedConsultant(localConsultant);
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

  useEffect(() => {
    if (!isConsultantModalOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsConsultantModalOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isConsultantModalOpen]);

  async function handleConsultantClick() {
    if (isAssigningRef.current || isLoadingConsultant) return;

    isAssigningRef.current = true;
    setIsLoadingConsultant(true);

    try {
      const nextConsultant = selectedConsultant || assignNextConsultant();

      setSelectedConsultant(nextConsultant);
      storeConsultant(nextConsultant);
      setIsConsultantModalOpen(true);

      await persistConsultant(nextConsultant);
    } finally {
      isAssigningRef.current = false;
      setIsLoadingConsultant(false);
    }
  }

  function handleClose() {
    setIsConsultantModalOpen(false);
  }

  const whatsAppUrl = selectedConsultant
    ? buildConsultantWhatsAppUrl(selectedConsultant)
    : undefined;

  const modal =
    isConsultantModalOpen && selectedConsultant ? (
      <div
        className="consultant-modal-overlay fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-3 py-6 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultant-modal-title"
        onClick={handleClose}
      >
        <div
          className="consultant-modal-panel relative w-[calc(100%_-_24px)] max-w-[360px] overflow-hidden border border-white/[0.12] bg-[#090909] p-[22px] text-text-inverse shadow-[0_28px_70px_rgba(0,0,0,0.52)] sm:w-[calc(100%_-_32px)] sm:max-w-[400px] sm:p-7"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-0 cta-grid opacity-45" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(130,0,0,0.18),transparent_48%)]" />

          <div className="relative">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center border border-white/10 text-sm leading-none text-white/60 transition-colors duration-250 hover:text-white"
              aria-label="Fechar"
            >
              x
            </button>

            <span className="tech-eyebrow dark max-w-[calc(100%_-_44px)] pr-2 text-[10px]">
              <span className="dot" />
              Atendimento direto
            </span>
            <h2
              id="consultant-modal-title"
              className="mt-5 font-serif text-[24px] leading-tight tracking-premium-tight text-[#f5f5f5] sm:text-[27px]"
            >
              Seu consultor Alpha
            </h2>

            <div className="mt-5 border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">
                Consultor atribuído
              </p>
              <p className="mt-3 text-lg font-medium tracking-premium-wide text-white sm:text-xl">
                {selectedConsultant.name}
              </p>
              <p className="mt-1.5 text-sm text-white/70">
                {formatConsultantPhone(selectedConsultant.phone)}
              </p>
            </div>

            {whatsAppUrl && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center border border-white/80 bg-white px-5 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-ink transition-all duration-450 ease-premium hover:bg-bg-soft sm:min-h-12"
                onClick={(event) => event.stopPropagation()}
              >
                Conversar pelo WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      <Button
        type="button"
        variant="light"
        loading={isLoadingConsultant}
        disabled={isLoadingConsultant}
        onClick={handleConsultantClick}
      >
        Falar com um consultor
      </Button>

      {isMounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
