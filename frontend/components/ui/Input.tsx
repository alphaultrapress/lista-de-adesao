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
      <div className="relative w-full">
        <input
          id={inputId}
          ref={ref}
          placeholder={rest.placeholder || " "}
          className={`peer input-premium w-full bg-bg-ice border text-text-primary px-4 pt-5 pb-2.5 text-[15px] placeholder-transparent focus:outline-none transition-all duration-250 ease-premium ${
            error
              ? "border-wine focus:border-wine"
              : "border-line hover:border-line-strong focus:border-ink"
          } ${rightSlot ? "pr-12" : ""} ${className}`}
          {...rest}
        />
        {label && (
          <label
            htmlFor={inputId}
            className={`absolute left-4 top-1.5 text-[10px] tracking-premium-widest uppercase font-medium text-text-tertiary transition-all duration-250 ease-premium pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-premium-widest peer-focus:text-ink ${error ? "text-wine peer-focus:text-wine" : ""}`}
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
        <p className="mt-2 text-xs text-wine">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-xs text-text-tertiary">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
