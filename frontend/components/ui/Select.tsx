"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
  variant?: "default" | "auth";
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, variant = "default", className = "", id, ...rest },
  ref,
) {
  const inputId = id || rest.name;
  const auth = variant === "auth";
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={`mb-2 block text-[10px] font-medium uppercase tracking-premium-widest ${auth ? "text-[#6F6D68]" : "text-text-tertiary"}`}
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        ref={ref}
        className={`w-full appearance-none border px-4 py-3.5 text-[15px] outline-none transition-all duration-250 ease-premium ${
          auth
            ? `h-[54px] rounded-[10px] bg-[#F8F7F3] text-[#111210] ${
                error
                  ? "border-[#C41230]"
                  : "border-[#D8D4CC] hover:border-[#AAA69E] focus:border-[#111210] focus:shadow-[0_0_0_3px_rgba(17,18,16,0.10)]"
              }`
            : `input-premium bg-bg-ice text-text-primary ${
                error ? "border-wine" : "border-line hover:border-line-strong"
              }`
        } ${className}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238A8A8A' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 1rem center",
          paddingRight: "2.5rem",
        }}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className={`mt-2 text-xs ${auth ? "text-[#C41230]" : "text-wine"}`}>{error}</p>}
    </div>
  );
});

export default Select;
