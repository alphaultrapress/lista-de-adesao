"use client";

import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  rightSlot?: ReactNode;
  variant?: "default" | "auth";
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, rightSlot, variant = "default", className = "", id, ...rest },
  ref,
) {
  const inputId = id || rest.name;
  const auth = variant === "auth";
  return (
    <div className="w-full">
      <div className="relative w-full">
        <input
          id={inputId}
          ref={ref}
          placeholder={rest.placeholder || " "}
          className={`peer w-full border px-4 pt-5 pb-2.5 text-[15px] placeholder-transparent outline-none transition-all duration-250 ease-premium ${
            auth
              ? `h-[54px] rounded-[10px] bg-[#F8F7F3] text-[#111210] ${
                  error
                    ? "border-[#C41230] focus:border-[#C41230]"
                    : "border-[#D8D4CC] hover:border-[#AAA69E] focus:border-[#111210] focus:shadow-[0_0_0_3px_rgba(17,18,16,0.10)]"
                }`
              : `input-premium bg-bg-ice text-text-primary ${
                  error
                    ? "border-wine focus:border-wine"
                    : "border-line hover:border-line-strong focus:border-ink"
                }`
          } ${rightSlot ? "pr-12" : ""} ${className}`}
          {...rest}
        />
        {label && (
          <label
            htmlFor={inputId}
            className={`absolute left-4 right-4 top-1.5 truncate whitespace-nowrap text-[10px] tracking-premium-widest uppercase font-medium transition-all duration-250 ease-premium pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:whitespace-normal peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-1.5 peer-focus:whitespace-nowrap peer-focus:truncate peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-premium-widest ${
              auth
                ? `${error ? "text-[#C41230] peer-focus:text-[#C41230]" : "text-[#6F6D68] peer-focus:text-[#111210]"}`
                : `text-text-tertiary peer-focus:text-ink ${error ? "text-wine peer-focus:text-wine" : ""}`
            }`}
          >
            {label}
          </label>
        )}
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
            {rightSlot}
          </div>
        )}
      </div>
      {error ? (
        <p className={`mt-2 text-xs ${auth ? "text-[#C41230]" : "text-wine"}`}>{error}</p>
      ) : hint ? (
        <p className={`mt-2 text-xs ${auth ? "text-[#6F6D68]" : "text-text-tertiary"}`}>{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
