"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import Spinner from "./Spinner";

type Variant = "primary" | "ghost" | "outline" | "champagne" | "dark";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs tracking-premium-wide uppercase transition-all duration-250 ease-premium disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-champagne/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-text-inverse hover:bg-ink-800 border border-ink",
  ghost:
    "bg-transparent text-text-primary hover:bg-black/5 border border-transparent",
  outline:
    "bg-transparent text-text-primary border border-line-strong hover:border-ink hover:bg-black/[0.03]",
  champagne:
    "bg-champagne text-ink hover:bg-champagne-deep border border-champagne",
  dark:
    "bg-ink text-text-inverse hover:bg-ink-800 border border-ink",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    loading,
    fullWidth,
    className = "",
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : null}
      <span>{children}</span>
    </button>
  );
});

export default Button;
