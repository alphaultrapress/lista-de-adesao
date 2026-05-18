"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";

interface HeaderAction {
  href: string;
  label: string;
  emphasis?: boolean;
}

interface PremiumHeaderProps {
  actions?: HeaderAction[];
  onLogout?: () => void;
  logoutLabel?: string;
  compact?: boolean;
  centeredBrand?: boolean;
  brandSize?: "sm" | "md" | "lg";
}

export default function PremiumHeader({
  actions = [],
  onLogout,
  logoutLabel = "Sair",
  compact = false,
  centeredBrand = false,
  brandSize,
}: PremiumHeaderProps) {
  return (
    <header
      className="fixed inset-x-0 top-0 z-[100]"
      style={{
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center px-5 sm:px-6 ${
          centeredBrand ? "justify-end" : "justify-between"
        } ${compact ? "h-[76px]" : "h-[94px]"} relative`}
      >
        <div className={centeredBrand ? "absolute left-1/2 -translate-x-1/2" : ""}>
          <Brand size={brandSize || (compact ? "md" : "lg")} variant="light" />
        </div>

        <nav className="flex items-center gap-2 sm:gap-4">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={action.emphasis ? "inline-flex items-center justify-center h-10 px-6 bg-[#C41230] text-white font-sans text-[11px] uppercase tracking-[0.15em] font-semibold transition-all duration-300 hover:bg-[#A50F28]" : "inline-flex items-center justify-center h-10 px-4 text-white/70 hover:text-white font-sans text-[11px] uppercase tracking-[0.15em] font-semibold transition-colors duration-300"}
            >
              {action.label}
            </Link>
          ))}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center h-10 px-4 text-white/70 hover:text-white font-sans text-[11px] uppercase tracking-[0.15em] font-semibold transition-colors duration-300"
            >
              {logoutLabel}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
