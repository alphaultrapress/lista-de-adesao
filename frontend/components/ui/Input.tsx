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
          className="block mb-2 text-[10px] tracking-premium-widest uppercase text-text-tertiary font-medium"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          className={`input-premium w-full bg-bg-ice border text-text-primary px-4 py-3.5 text-[15px] placeholder:text-text-tertiary/70 transition-all duration-250 ease-premium ${
            error
              ? "border-wine"
              : "border-line hover:border-line-strong"
          } ${rightSlot ? "pr-12" : ""} ${className}`}
          {...rest}
        />
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
