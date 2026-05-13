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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`premium-header fixed inset-x-0 top-0 z-50 ${
        scrolled ? "premium-header-scrolled" : ""
      }`}
    >
      <div
        className={`premium-header-inner mx-auto flex max-w-7xl items-center px-5 sm:px-6 ${
          centeredBrand ? "justify-end" : "justify-between"
        } ${compact ? "h-[76px]" : "h-[94px]"} ${
          centeredBrand ? "premium-header-inner-centered" : ""
        }`}
      >
        <Brand size={brandSize || (compact ? "md" : "lg")} variant="light" />

        <nav className="flex items-center gap-2 sm:gap-4">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={action.emphasis ? "premium-nav-cta" : "premium-nav-link"}
            >
              {action.label}
            </Link>
          ))}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="premium-nav-link premium-nav-action"
            >
              {logoutLabel}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
