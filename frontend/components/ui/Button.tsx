"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import Spinner from "./Spinner";

type Variant = "primary" | "ghost" | "outline" | "light" | "dark";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[11px] tracking-premium-wide uppercase transition-all duration-450 ease-premium disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 focus-visible:ring-offset-bg relative overflow-hidden";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-text-inverse hover:bg-ink-800 border border-ink hover:shadow-[0_18px_40px_-20px_rgba(110,20,20,0.5)] hover:-translate-y-px",
  ghost:
    "bg-transparent text-text-primary hover:bg-black/5 border border-transparent",
  outline:
    "bg-transparent text-text-primary border border-line-strong hover:border-ink hover:bg-black/[0.03]",
  light:
    "bg-white text-ink hover:bg-bg-soft border border-white hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.3)]",
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
      <span className="relative z-10">{children}</span>
    </button>
  );
});

export default Button;
