"use client";

import { useMemo, useState } from "react";
import { X, MessageCircle, Pencil } from "lucide-react";
import { ADM, RADIUS } from "@/lib/admin/tokens";
import type { RepLinha } from "@/lib/admin/data";
import { META_CONVITES } from "@/lib/supabase";

/* ══════════════════════════════════════════════════════════════════════════
   Disparo manual de WhatsApp.

   O envio é humano de propósito: automatizar WhatsApp exige a Business API da
   Meta, com modelo aprovado por eles e custo por conversa — e fazer isso de um
   número comum é o caminho curto para tomar bloqueio. Aqui só o texto é
   automático; quem aperta o botão é a equipe.
   ══════════════════════════════════════════════════════════════════════════ */

type Modelo = {
  chave: string;
  rotulo: string;
  /** Quando esse modelo é o mais adequado para a situação da turma. */
  quando: string;
  texto: (d: Dados) => string;
};

type Dados = {
  primeiroNome: string;
  curso: string;
  convites: number;
  faltam: number;
  link: string;
};

const MODELOS: Modelo[] = [
  {
    chave: "nunca_compartilhou",
    rotulo: "Ainda não compartilhou",
    quando: "A lista tem só o próprio representante",
    texto: (d) =>
      `Oi, ${d.primeiroNome}! Aqui é a Alpha 👋\n\n` +
      `A lista da ${d.curso} já está no ar, mas por enquanto só com você nela.\n\n` +
      `É só mandar esse link no grupo da turma:\n${d.link}\n\n` +
      `Quanto mais gente entra, melhores as condições que a gente consegue fechar para vocês.`,
  },
  {
    chave: "travou",
    rotulo: "Começou e travou",
    quando: "Entre 2 e 14 convites",
    texto: (d) =>
      `Oi, ${d.primeiroNome}! A lista da ${d.curso} está com ${d.convites} convites.\n\n` +
      `Faltam ${d.faltam} para a turma bater os ${META_CONVITES} e a nossa equipe entrar com a proposta.\n\n` +
      `Uma passada no grupo costuma render mais que a primeira:\n${d.link}`,
  },
  {
    chave: "quase_la",
    rotulo: "Quase lá",
    quando: "Entre 15 e 29 convites",
    texto: (d) =>
      `Oi, ${d.primeiroNome}! Faltam só ${d.faltam} convites para fechar os ${META_CONVITES} da ${d.curso}.\n\n` +
      `É o empurrão final:\n${d.link}`,
  },
  {
    chave: "meta_atingida",
    rotulo: "Meta atingida",
    quando: "Já passou dos 30 convites",
    texto: (d) =>
      `Oi, ${d.primeiroNome}! A ${d.curso} já passou dos ${META_CONVITES} convites 🎉\n\n` +
      `A lista continua aberta: cada colega que entra depois da meta fortalece a negociação de vocês.\n\n` +
      `${d.link}`,
  },
];

/** Escolhe o modelo que combina com o estado atual da turma. */
function modeloSugerido(convites: number, adesoes: number) {
  if (convites >= META_CONVITES) return "meta_atingida";
  if (adesoes <= 1) return "nunca_compartilhou";
  if (convites < 15) return "travou";
  return "quase_la";
}

/** wa.me exige só dígitos, com o código do país na frente. */
function paraWaMe(telefone: string) {
  const digitos = telefone.replace(/\D/g, "");
  if (!digitos) return "";
  // 10 (fixo) ou 11 (celular) dígitos = número local, falta o 55.
  return digitos.length <= 11 ? `55${digitos}` : digitos;
}

export default function WhatsAppModal({
  linha,
  onClose,
}: {
  linha: RepLinha & { telefone?: string };
  onClose: () => void;
}) {
  const dados = useMemo<Dados>(() => {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    return {
      primeiroNome: (linha.name || "").trim().split(/\s+/)[0] || "",
      curso: linha.course_name,
      convites: linha.convites,
      faltam: Math.max(0, META_CONVITES - linha.convites),
      link: `${base}/adesao/${linha.slug}`,
    };
  }, [linha]);

  const [escolhido, setEscolhido] = useState(() =>
    modeloSugerido(linha.convites, linha.adesoes),
  );
  const [texto, setTexto] = useState(
    () =>
      MODELOS.find((m) => m.chave === modeloSugerido(linha.convites, linha.adesoes))!
        .texto(dados),
  );
  const [editado, setEditado] = useState(false);

  function trocarModelo(chave: string) {
    setEscolhido(chave);
    setTexto(MODELOS.find((m) => m.chave === chave)!.texto(dados));
    setEditado(false);
  }

  const telefone = linha.telefone ? paraWaMe(linha.telefone) : "";
  const href = telefone
    ? `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`
    : "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Enviar WhatsApp"
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="relative flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden border"
        style={{
          background: ADM.surface,
          borderColor: ADM.border,
          borderRadius: RADIUS,
          boxShadow: "0 30px 70px -25px rgba(0,0,0,0.35)",
        }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: ADM.border }}
        >
          <div className="min-w-0">
            <p className="text-[15px] font-semibold" style={{ color: ADM.text }}>
              Enviar WhatsApp
            </p>
            <p className="mt-0.5 truncate text-[13px]" style={{ color: ADM.textMuted }}>
              {linha.name} · {linha.course_name} · {linha.convites}/{META_CONVITES} convites
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-black/5"
            style={{ color: ADM.textMuted }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: ADM.textMuted }}
          >
            Modelo
          </p>

          <div className="mt-2.5 grid gap-2">
            {MODELOS.map((m) => {
              const ativo = m.chave === escolhido;
              return (
                <button
                  key={m.chave}
                  type="button"
                  onClick={() => trocarModelo(m.chave)}
                  className="flex items-center justify-between gap-3 border px-3.5 py-2.5 text-left transition-colors"
                  style={{
                    borderRadius: 8,
                    borderColor: ativo ? ADM.ink : ADM.border,
                    background: ativo ? "rgba(17,18,16,0.04)" : "transparent",
                  }}
                >
                  <span>
                    <span
                      className="block text-[13px] font-medium"
                      style={{ color: ADM.text }}
                    >
                      {m.rotulo}
                    </span>
                    <span className="block text-[12px]" style={{ color: ADM.textMuted }}>
                      {m.quando}
                    </span>
                  </span>
                  {ativo && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: "rgba(17,18,16,0.08)", color: ADM.text }}
                    >
                      escolhido
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: ADM.textMuted }}
            >
              Mensagem
            </p>
            {editado && (
              <span
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ color: ADM.textMuted }}
              >
                <Pencil size={11} /> editada
              </span>
            )}
          </div>

          <textarea
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setEditado(true);
            }}
            rows={10}
            className="mt-2 w-full resize-y border px-3.5 py-3 text-[13px] leading-[1.55] outline-none transition-colors focus:border-[#111210]"
            style={{ borderRadius: 8, borderColor: ADM.border, color: ADM.text }}
          />
          <p className="mt-2 text-[12px]" style={{ color: ADM.textMuted }}>
            Dá para editar antes de enviar. O texto vai preenchido no WhatsApp — o
            envio é feito por você.
          </p>
        </div>

        <div
          className="flex items-center justify-between gap-4 border-t px-5 py-4"
          style={{ borderColor: ADM.border }}
        >
          <span className="text-[12px]" style={{ color: ADM.textMuted }}>
            {linha.telefone ? linha.telefone : "Telefone não encontrado"}
          </span>

          {telefone ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="inline-flex h-10 items-center gap-2 px-4 text-[13px] font-semibold text-white transition-transform hover:-translate-y-0.5"
              style={{ borderRadius: 8, background: "#1FA855" }}
            >
              <MessageCircle size={15} />
              Abrir no WhatsApp
            </a>
          ) : (
            <span className="text-[12px]" style={{ color: ADM.danger }}>
              Sem telefone cadastrado para esta turma.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
