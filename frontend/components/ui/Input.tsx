"use client";

import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  rightSlot?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, rightSlot, className = "", id, ...rest },
  ref,
) {
  const inputId = id || rest.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block mb-2 text-[11px] tracking-premium-wide uppercase text-premium-light1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          className={`w-full bg-premium-dark1 hairline border-premium-dark3 text-premium-white px-4 py-3 text-sm placeholder-premium-mid2 focus:border-premium-gold focus:outline-none transition-colors duration-200 ${
            error ? "border-premium-wine" : ""
          } ${rightSlot ? "pr-12" : ""} ${className}`}
          {...rest}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {rightSlot}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-2 text-xs text-premium-wine">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-xs text-premium-mid2">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
