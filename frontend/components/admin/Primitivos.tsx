"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Circle, Clock, Info, MinusCircle, Ban } from "lucide-react";
import { ADM, RADIUS } from "@/lib/admin/tokens";
import { STATUS_LABEL, type StatusRep } from "@/lib/admin/data";

/** Superfície branca com borda — a base de tudo no painel. */
export function Painel({
  children,
  className,
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <section
      className={className}
      style={{
        background: ADM.surface,
        border: `1px solid ${ADM.border}`,
        borderRadius: RADIUS,
        padding: padding ? 20 : 0,
      }}
    >
      {children}
    </section>
  );
}

export function TituloPainel({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[14px] font-semibold" style={{ color: ADM.text }}>
          {titulo}
        </h2>
        {descricao && (
          <p className="mt-1 text-[12.5px]" style={{ color: ADM.textMuted }}>
            {descricao}
          </p>
        )}
      </div>
      {acao}
    </div>
  );
}

/* ──────────────────────────────── status ─────────────────────────────────── */

const ESTILO: Record<StatusRep, { cor: string; fundo: string; icone: typeof Circle }> = {
  novo: { cor: "#2C5AA0", fundo: "rgba(44,90,160,0.09)", icone: Circle },
  em_andamento: { cor: ADM.warning, fundo: "rgba(162,103,25,0.10)", icone: Clock },
  pendente: { cor: ADM.textMuted, fundo: "rgba(111,113,107,0.10)", icone: MinusCircle },
  meta_atingida: { cor: ADM.success, fundo: "rgba(35,122,75,0.10)", icone: CheckCircle2 },
  inativo: { cor: ADM.textMuted, fundo: "rgba(111,113,107,0.10)", icone: MinusCircle },
  bloqueado: { cor: ADM.danger, fundo: "rgba(180,35,45,0.09)", icone: Ban },
};

/** Badge sóbrio. Nunca depende só da cor: leva ícone e texto. */
export function StatusBadge({ status }: { status: StatusRep }) {
  const e = ESTILO[status];
  const I = e.icone;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11.5px] font-medium"
      style={{ background: e.fundo, color: e.cor }}
    >
      <I size={12} strokeWidth={2} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ────────────────────────────── estados vazios ───────────────────────────── */

export function Vazio({ titulo, detalhe }: { titulo: string; detalhe?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <Info size={18} strokeWidth={1.6} color={ADM.textMuted} />
      <p className="mt-3 text-[13px] font-medium" style={{ color: ADM.text }}>
        {titulo}
      </p>
      {detalhe && (
        <p className="mt-1 max-w-[42ch] text-[12.5px]" style={{ color: ADM.textMuted }}>
          {detalhe}
        </p>
      )}
    </div>
  );
}

export function ErroBloco({ mensagem }: { mensagem: string }) {
  return (
    <div
      className="flex items-start gap-2.5 px-4 py-3 text-[13px]"
      style={{
        borderRadius: RADIUS,
        border: `1px solid ${ADM.danger}`,
        background: "rgba(180,35,45,0.05)",
        color: ADM.danger,
      }}
    >
      <AlertTriangle size={15} strokeWidth={1.8} className="mt-[1px] shrink-0" />
      <span>{mensagem}</span>
    </div>
  );
}

export function Skeleton({ h = 12, w = "100%" }: { h?: number; w?: number | string }) {
  return (
    <span
      className="block animate-pulse rounded"
      style={{ height: h, width: w, background: ADM.bg }}
    />
  );
}

/* ───────────────────────────────── indicador ─────────────────────────────── */

/**
 * Cartão de indicador.
 *
 * Altura fixa para os quatro ficarem idênticos na linha, e o número dominando:
 * rótulo curto em cima, valor grande, uma linha de apoio embaixo.
 */
export function CardIndicador({
  label,
  valor,
  apoio,
  calculo,
  href,
  destaque = false,
}: {
  label: string;
  valor: string;
  apoio: string;
  calculo: string;
  href: string;
  /** Marca o indicador-chave com o verde de sucesso. */
  destaque?: boolean;
}) {
  return (
    <Link
      href={href}
      title={calculo}
      className="flex flex-col justify-between transition-colors hover:border-[#C9CBC4]"
      style={{
        height: 132,
        background: ADM.surface,
        border: `1px solid ${ADM.border}`,
        borderRadius: RADIUS,
        padding: 18,
      }}
    >
      <p
        className="truncate text-[11px] uppercase"
        style={{ letterSpacing: "0.1em", color: ADM.textMuted }}
      >
        {label}
      </p>
      <p
        className="font-semibold leading-none"
        style={{
          fontSize: 34,
          letterSpacing: "-0.03em",
          color: destaque ? ADM.success : ADM.text,
        }}
      >
        {valor}
      </p>
      <p className="truncate text-[12px]" style={{ color: ADM.textMuted }}>
        {apoio}
      </p>
    </Link>
  );
}
