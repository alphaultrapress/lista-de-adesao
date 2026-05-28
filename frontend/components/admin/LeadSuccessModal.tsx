"use client";

import Image from "next/image";

interface Props {
  open: boolean;
  leadId?: number;
  onClose: () => void;
  onDownloadPdf: () => void;
}

export default function LeadSuccessModal({
  open,
  leadId,
  onClose,
  onDownloadPdf,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0A0805]/70 backdrop-blur-sm fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[8px] border border-[rgba(184,146,62,0.35)] fade-up"
        style={{
          background:
            "linear-gradient(160deg, #FAF7F2 0%, #F3EDE3 55%, #ECE4D6 100%)",
          boxShadow:
            "0 40px 80px -20px rgba(20,15,10,0.55), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        {/* Halo verde neon no topo */}
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2"
          style={{
            background:
              "radial-gradient(circle, rgba(0,255,127,0.35) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center text-text-tertiary transition-colors hover:text-text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="relative px-8 pb-8 pt-10 text-center">
          {/* Logo */}
          <Image
            src="/logos/logo-dark.png"
            alt="Alpha Convites"
            width={320}
            height={107}
            className="mx-auto h-auto w-[120px]"
            priority
          />

          {/* Check neon quadrado */}
          <div className="relative mx-auto mt-8 mb-2 h-20 w-20">
            <div
              className="absolute inset-0 border-2 border-[#00ff7f] bg-[#00ff7f]"
              style={{
                boxShadow:
                  "0 0 24px rgba(0,255,127,0.55), 0 0 48px rgba(0,255,127,0.25)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[#0A0805]">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12l4 4L19 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div
              className="absolute -inset-3 border border-[#00ff7f]/30 animate-glow"
              style={{ boxShadow: "0 0 44px rgba(0,255,127,0.18)" }}
            />
          </div>

          <p className="mt-6 text-[10px] uppercase tracking-premium-widest text-[#0a7d3a]">
            Lead enviado ao Bitrix
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-premium-tight text-text-primary">
            Enviado com{" "}
            <span className="italic font-light text-[#0a7d3a]">sucesso.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
            O lead foi criado no Bitrix24 e atribuído à equipe comercial.
            {leadId ? ` (Lead #${leadId})` : ""}
          </p>

          {/* Baixar lead em PDF */}
          <button
            type="button"
            onClick={onDownloadPdf}
            className="group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-[3px] border border-line bg-white px-6 py-3.5 text-[11px] uppercase tracking-premium-wide font-semibold text-text-primary transition-all duration-300 hover:border-text-primary hover:-translate-y-[1px] hover:shadow-[0_12px_28px_-14px_rgba(20,15,10,0.4)]"
          >
            <svg
              width="14"
              height="14"
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
            Baixar lead em PDF
          </button>
        </div>
      </div>
    </div>
  );
}
