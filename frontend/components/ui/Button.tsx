"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import Spinner from "./Spinner";

type Variant = "primary" | "ghost" | "outline" | "gold";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 px-6 py-3 text-sm tracking-premium-wide uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-premium-gold/60";

const variants: Record<Variant, string> = {
  primary:
    "bg-premium-white text-premium-black hover:bg-premium-light2 border-[0.5px] border-premium-white",
  ghost:
    "bg-transparent text-premium-light2 hover:text-premium-white hover:bg-premium-dark2 border-[0.5px] border-transparent",
  outline:
    "bg-transparent text-premium-white border-[0.5px] border-premium-mid1 hover:border-premium-gold hover:text-premium-gold",
  gold:
    "bg-premium-gold text-premium-black hover:bg-[#b8985f] border-[0.5px] border-premium-gold",
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
