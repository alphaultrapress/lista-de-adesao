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
  "inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 focus-visible:ring-offset-2 focus-visible:ring-offset-bg relative overflow-hidden";

const variants: Record<Variant, string> = {
  primary: "btn-primary-tech",
  ghost:
    "px-7 py-3.5 text-[11px] tracking-premium-wide uppercase bg-transparent text-text-primary hover:bg-black/5 border border-transparent transition-all duration-450 ease-premium",
  outline: "btn-secondary-tech",
  light:
    "px-7 py-3.5 text-[11px] tracking-premium-wide uppercase bg-white text-ink hover:bg-bg-soft border border-white/70 hover:shadow-[0_22px_48px_-34px_rgba(0,0,0,0.42)] transition-all duration-450 ease-premium",
  dark: "btn-primary-tech",
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
