"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface TourStep {
  target: string;
  title: string;
  description: string;
}

interface TargetBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface PopupPosition {
  top: number;
  left: number;
  width: number;
  isAboveTarget: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "share-access",
    title: "Envie o convite",
    description:
      "Use Copiar ou WhatsApp para mandar o link da turma para os seus colegas.",
  },
  {
    target: "progress",
    title: "Veja o progresso",
    description:
      "Aqui você acompanha quantas pessoas já entraram e quanto falta para chegar na meta.",
  },
  {
    target: "add-student",
    title: "Adicione um colega",
    description:
      "Se alguém não conseguir entrar pelo link, clique aqui e coloque os dados da pessoa.",
  },
  {
    target: "edit-invites",
    title: "Mude a quantidade",
    description:
      "Clique em Editar quando precisar mudar a quantidade de convites de alguém.",
  },
];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getTargetBounds(element: HTMLElement): TargetBounds {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

function getPopupPosition(
  bounds: TargetBounds,
  viewportWidth: number,
  viewportHeight: number,
  popupHeight: number,
): PopupPosition {
  const gap = 16;
  const mobile = viewportWidth < 640;
  const width = Math.min(mobile ? 360 : 348, viewportWidth - gap * 2);
  const spaceBelow = viewportHeight - bounds.bottom;
  const spaceAbove = bounds.top;
  const isAboveTarget =
    spaceBelow < popupHeight + 28 && spaceAbove > popupHeight + 28;
  const suggestedTop = isAboveTarget
    ? bounds.top - popupHeight - 22
    : bounds.bottom + 22;
  const suggestedLeft = mobile
    ? gap
    : bounds.left + Math.min(bounds.width - width, 48);

  return {
    top: clamp(suggestedTop, gap, viewportHeight - popupHeight - gap),
    left: clamp(suggestedLeft, gap, viewportWidth - width - gap),
    width,
    isAboveTarget,
  };
}

function getSnakePath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
) {
  const horizontalDirection = endX >= startX ? 1 : -1;
  const verticalDirection = endY >= startY ? 1 : -1;
  const horizontalCurve = Math.min(92, Math.max(44, Math.abs(endX - startX) * 0.42));
  const verticalCurve = Math.min(86, Math.max(38, Math.abs(endY - startY) * 0.34));

  return `M ${startX} ${startY} C ${startX + horizontalDirection * horizontalCurve} ${startY + verticalDirection * verticalCurve}, ${endX - horizontalDirection * horizontalCurve} ${endY - verticalDirection * verticalCurve}, ${endX} ${endY}`;
}

export default function DashboardTour({ representativeId }: { representativeId: string }) {
  const storageKey = `alpha-dashboard-tour:${representativeId}:v1`;
  const popupRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetBounds, setTargetBounds] = useState<TargetBounds | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [popupHeight, setPopupHeight] = useState(236);

  const currentStep = TOUR_STEPS[stepIndex];
  const popupPosition = useMemo(() => {
    if (!targetBounds || !viewport.width || !viewport.height) return null;
    return getPopupPosition(
      targetBounds,
      viewport.width,
      viewport.height,
      popupHeight,
    );
  }, [popupHeight, targetBounds, viewport]);

  const arrowPath = useMemo(() => {
    if (!targetBounds || !popupPosition) return null;

    const startX = clamp(
      targetBounds.left + targetBounds.width * 0.5,
      popupPosition.left + 42,
      popupPosition.left + popupPosition.width - 42,
    );
    const startY = popupPosition.isAboveTarget
      ? popupPosition.top + popupHeight
      : popupPosition.top;
    const endX = targetBounds.left + targetBounds.width * 0.5;
    const endY = popupPosition.isAboveTarget
      ? targetBounds.top
      : targetBounds.bottom;

    return getSnakePath(startX, startY, endX, endY);
  }, [popupHeight, popupPosition, targetBounds]);

  useEffect(() => {
    const completed = window.localStorage.getItem(storageKey) === "done";
    setOpen(!completed);
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;

    let didScrollToTarget = false;
    const updateTarget = () => {
      const target = document.querySelector<HTMLElement>(
        `[data-dashboard-tour="${currentStep.target}"]`,
      );
      setViewport({ width: window.innerWidth, height: window.innerHeight });

      if (!target) {
        setTargetBounds(null);
        return false;
      }

      if (!didScrollToTarget) {
        didScrollToTarget = true;
        target.scrollIntoView({
          behavior: "smooth",
          block: window.innerWidth < 640 ? "center" : "nearest",
          inline: "nearest",
        });
      }

      setTargetBounds(getTargetBounds(target));
      return true;
    };

    updateTarget();
    const deferredUpdate = window.setTimeout(updateTarget, 380);
    let attempts = 0;
    const retryTarget = window.setInterval(() => {
      if (updateTarget() || attempts++ > 24) {
        window.clearInterval(retryTarget);
      }
    }, 250);

    const handleViewportChange = () => updateTarget();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, { passive: true });

    return () => {
      window.clearTimeout(deferredUpdate);
      window.clearInterval(retryTarget);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange);
    };
  }, [currentStep.target, open]);

  useEffect(() => {
    if (!open || !popupRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (popupRef.current) {
        setPopupHeight(popupRef.current.getBoundingClientRect().height);
      }
    });
    resizeObserver.observe(popupRef.current);
    setPopupHeight(popupRef.current.getBoundingClientRect().height);

    return () => resizeObserver.disconnect();
  }, [open, stepIndex, targetBounds]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      window.localStorage.setItem(storageKey, "done");
      setOpen(false);
      setStepIndex(0);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, storageKey]);

  function finishTour() {
    window.localStorage.setItem(storageKey, "done");
    setOpen(false);
    setStepIndex(0);
  }

  function showTour() {
    setStepIndex(0);
    setOpen(true);
  }

  function nextStep() {
    if (stepIndex === TOUR_STEPS.length - 1) {
      finishTour();
      return;
    }
    setStepIndex((currentIndex) => currentIndex + 1);
  }

  function previousStep() {
    setStepIndex((currentIndex) => Math.max(currentIndex - 1, 0));
  }

  if (!ready) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={showTour}
        className="fixed bottom-4 left-4 z-40 inline-flex h-11 items-center gap-2 rounded-full border bg-[#FAF9F6] px-4 text-[12px] font-semibold text-[#111210] shadow-[0_12px_30px_rgba(17,18,16,0.16)] transition-transform duration-200 hover:-translate-y-0.5"
        style={{ borderColor: "#D8D4CC" }}
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#111210] text-[12px] text-white">
          ?
        </span>
        Como usar
      </button>
    );
  }

  if (!targetBounds || !popupPosition) {
    return (
      <div className="fixed inset-0 z-[140] grid place-items-center p-4">
        <div
          className="w-full max-w-sm rounded-[20px] border p-6 text-center shadow-[0_24px_64px_rgba(17,18,16,0.24)]"
          style={{ background: "#FAF9F6", borderColor: "#D8D4CC" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F6D68]">
            Guia do painel
          </p>
          <p className="mt-3 text-lg font-medium text-[#111210]">Preparando o próximo passo...</p>
          <button
            type="button"
            onClick={finishTour}
            className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F6D68] hover:text-[#111210]"
          >
            Fechar guia
          </button>
        </div>
      </div>
    );
  }

  const highlightInset = 7;
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes dashboard-tour-snake {
          to { stroke-dashoffset: -28; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dashboard-tour-snake { animation: none !important; }
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none fixed z-[120] rounded-[24px] border-2 border-[#C41230]"
        style={{
          top: targetBounds.top - highlightInset,
          left: targetBounds.left - highlightInset,
          width: targetBounds.width + highlightInset * 2,
          height: targetBounds.height + highlightInset * 2,
          boxShadow: "0 0 0 9999px rgba(17,18,16,0.58), 0 0 0 5px rgba(196,18,48,0.14)",
        }}
      />

      {arrowPath && (
        <svg
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[125] h-screen w-screen overflow-visible"
        >
          <defs>
            <marker
              id="dashboard-tour-arrowhead"
              markerHeight="9"
              markerWidth="9"
              orient="auto"
              refX="7"
              refY="3.5"
            >
              <path d="M0,0 L0,7 L8,3.5 z" fill="#C41230" />
            </marker>
          </defs>
          <path
            d={arrowPath}
            fill="none"
            stroke="rgba(250,249,246,0.42)"
            strokeLinecap="round"
            strokeWidth="7"
          />
          <path
            d={arrowPath}
            className="dashboard-tour-snake"
            fill="none"
            markerEnd="url(#dashboard-tour-arrowhead)"
            stroke="#C41230"
            strokeDasharray="5 10"
            strokeLinecap="round"
            strokeWidth="3"
            style={{ animation: "dashboard-tour-snake 1.15s linear infinite" }}
          />
        </svg>
      )}

      <div
        ref={popupRef}
        role="dialog"
        aria-label={`Guia do painel: ${currentStep.title}`}
        className="fixed z-[130] rounded-[20px] border p-5 shadow-[0_24px_64px_rgba(17,18,16,0.28)] sm:p-6"
        style={{
          top: popupPosition.top,
          left: popupPosition.left,
          width: popupPosition.width,
          background: "#FAF9F6",
          borderColor: "#D8D4CC",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F6D68]">
              Guia rápido · {stepIndex + 1} de {TOUR_STEPS.length}
            </p>
            <h2 className="mt-2 text-[25px] font-light tracking-[-0.04em] text-[#111210]">
              {currentStep.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={finishTour}
            className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F6D68] transition-colors hover:text-[#111210]"
          >
            Pular
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-[#5D5B56]">
          {currentStep.description}
        </p>

        <div className="mt-5 flex gap-1.5" aria-hidden>
          {TOUR_STEPS.map((step, index) => (
            <span
              key={step.target}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: index <= stepIndex ? "#C41230" : "#DDD9D1" }}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={previousStep}
              className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F6D68] transition-colors hover:text-[#111210]"
            >
              Voltar
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={nextStep}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#111210] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(17,18,16,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            {isLastStep ? "Pronto, entendi" : "Entendi, continuar"}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
