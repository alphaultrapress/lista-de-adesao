"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, LogOut, X } from "lucide-react";
import { NAV } from "@/lib/admin/nav";
import { ADM, SIDEBAR_MS, SIDEBAR_W, SIDEBAR_W_COLLAPSED } from "@/lib/admin/tokens";

/** logo-white.png é 2000×1000 com a marca em 41% da altura → caixa 4.878:1. */
const LOGO_H = 30;
const LOGO_W = Math.round(LOGO_H * 4.878);

/** A caixa recorta a transparência do PNG; o `cover` cuida do resto. */
function MarcaAlpha() {
  return (
    <span className="block overflow-hidden" style={{ width: LOGO_W, height: LOGO_H }}>
      <Image
        src="/logos/logo-white.png"
        alt="Alpha Convites"
        width={LOGO_W}
        height={LOGO_H}
        priority
        style={{ width: LOGO_W, height: LOGO_H, objectFit: "cover", objectPosition: "center" }}
      />
    </span>
  );
}

export default function AdminSidebar({
  recolhida,
  onToggle,
  emailAdmin,
  onLogout,
  /** No mobile a sidebar é drawer: recebe o fechar em vez do recolher. */
  mobile = false,
  onFechar,
}: {
  recolhida: boolean;
  onToggle: () => void;
  emailAdmin: string | null;
  onLogout: () => void;
  mobile?: boolean;
  onFechar?: () => void;
}) {
  const pathname = usePathname();
  // No drawer nunca fica comprimida — em tela estreita ícone sozinho não ajuda.
  const compacta = recolhida && !mobile;

  const ativo = (href: string) =>
    href === "/admin/dashboard"
      ? pathname === href || pathname.startsWith("/admin/dashboard/")
      : pathname.startsWith(href);

  return (
    <aside
      className="flex h-full flex-col"
      style={{
        width: mobile ? 280 : compacta ? SIDEBAR_W_COLLAPSED : SIDEBAR_W,
        background: ADM.sidebar,
        transition: `width ${SIDEBAR_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }}
    >
      {/* topo: só a marca e o botão de recolher. O rótulo "Administração" saiu
          daqui — não caberia junto da marca sem truncar, e a migalha de pão do
          header já diz onde o usuário está. */}
      {/* Recolhida a marca some: em 76px ela ficaria espremida, e um símbolo
          cortado atrapalha mais do que ajuda. Sobra só o botão de expandir. */}
      <div
        className={`flex items-center ${compacta ? "justify-center px-3" : "gap-2 px-4"}`}
        style={{ height: 72, borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {!compacta && (
          <Link href="/admin/dashboard" className="block shrink-0" aria-label="Alpha Convites">
            <MarcaAlpha />
          </Link>
        )}

        <button
          type="button"
          onClick={mobile ? onFechar : onToggle}
          aria-label={mobile ? "Fechar menu" : compacta ? "Expandir menu" : "Recolher menu"}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${compacta ? "" : "ml-auto"}`}
          style={{ color: "rgba(255,255,255,0.55)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {mobile ? <X size={16} /> : compacta ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        <ul className="px-2">
          {NAV.map((item) => {
            const on = ativo(item.href);
            const Icone = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onFechar?.()}
                  aria-current={on ? "page" : undefined}
                  title={compacta ? item.label : undefined}
                  className="group relative flex items-center gap-3 rounded-md px-3 py-[10px] text-[13px] transition-colors"
                  style={{
                    // Ativo: branco em baixa opacidade, sem glow nem cor forte.
                    background: on ? "rgba(255,255,255,0.10)" : "transparent",
                    color: on ? "#FFFFFF" : "rgba(255,255,255,0.66)",
                    justifyContent: compacta ? "center" : "flex-start",
                  }}
                  onMouseEnter={(e) => {
                    if (!on) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    if (!on) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {on && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                      style={{ width: 2, height: 18, background: "rgba(255,255,255,0.85)" }}
                    />
                  )}
                  <Icone size={17} strokeWidth={1.6} className="shrink-0" />
                  {!compacta && <span className="truncate">{item.label}</span>}

                  {/* tooltip da versão recolhida */}
                  {compacta && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-[calc(100%+10px)] z-50 hidden whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] group-hover:block"
                      style={{
                        background: ADM.ink,
                        color: "#FFFFFF",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* rodapé: quem está logado e a saída */}
      <div className="p-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div
          className="flex items-center gap-3 rounded-md px-2 py-2"
          style={{ justifyContent: compacta ? "center" : "flex-start" }}
          title={emailAdmin || "Administrador"}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ background: "rgba(255,255,255,0.12)", color: "#FFFFFF" }}
          >
            {(emailAdmin || "A").slice(0, 1).toUpperCase()}
          </span>
          {!compacta && (
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[12.5px]" style={{ color: "#FFFFFF" }}>
                {emailAdmin || "Administrador"}
              </span>
              <span className="block text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                Administrador
              </span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors"
          style={{
            color: "rgba(255,255,255,0.66)",
            justifyContent: compacta ? "center" : "flex-start",
          }}
          title={compacta ? "Sair" : undefined}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={16} strokeWidth={1.6} className="shrink-0" />
          {!compacta && "Sair"}
        </button>
      </div>
    </aside>
  );
}
