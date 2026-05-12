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
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, placeholder, className = "", id, ...rest },
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
      <select
        id={inputId}
        ref={ref}
        className={`w-full bg-premium-dark1 hairline border-premium-dark3 text-premium-white px-4 py-3 text-sm focus:border-premium-gold focus:outline-none transition-colors duration-200 ${
          error ? "border-premium-wine" : ""
        } ${className}`}
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
      {error && <p className="mt-2 text-xs text-premium-wine">{error}</p>}
    </div>
  );
});

export default Select;
