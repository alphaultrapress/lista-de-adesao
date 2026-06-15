"use client";

interface Props {
  open: boolean;
  name?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDeleteModal({
  open,
  name,
  loading,
  onConfirm,
  onClose,
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
        onClick={loading ? undefined : onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[8px] border border-wine/35 fade-up"
        style={{
          background:
            "linear-gradient(160deg, #FAF7F2 0%, #F3EDE3 55%, #ECE4D6 100%)",
          boxShadow:
            "0 40px 80px -20px rgba(20,15,10,0.55), inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center text-text-tertiary transition-colors hover:text-text-primary disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="relative px-8 pb-8 pt-10 text-center">
          {/* Ícone de lixeira em destaque */}
          <div className="relative mx-auto mb-2 h-20 w-20">
            <div className="absolute inset-0 flex items-center justify-center rounded-full border border-wine/25 bg-wine/8 text-wine">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
          </div>

          <p className="mt-6 text-[10px] uppercase tracking-premium-widest text-wine">
            Remover representante
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-premium-tight text-text-primary">
            Tem{" "}
            <span className="italic font-light text-wine">certeza?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
            {name ? (
              <>
                Isto remove <span className="font-semibold text-text-primary">{name}</span> e
                todos os alunos cadastrados nesta turma.
              </>
            ) : (
              "Isto remove o representante e todos os alunos cadastrados nesta turma."
            )}{" "}
            Esta ação não pode ser desfeita.
          </p>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center rounded-[3px] border border-line bg-white px-6 py-3.5 text-[11px] uppercase tracking-premium-wide font-semibold text-text-primary transition-all duration-300 hover:border-text-primary hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-[3px] bg-wine px-6 py-3.5 text-[11px] uppercase tracking-premium-wide font-semibold text-white shadow-[0_8px_20px_-8px_rgba(124,30,49,0.5)] transition-all duration-300 hover:bg-[#6a1a2a] hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {!loading && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              )}
              {loading ? "Removendo…" : "Remover"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
