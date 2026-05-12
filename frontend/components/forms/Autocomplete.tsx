"use client";

import { useMemo, useState } from "react";
import Input from "../ui/Input";

interface AutocompleteProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  name?: string;
  required?: boolean;
}

export default function Autocomplete({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  name,
  required,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = value.toLowerCase().trim();
    if (!q) return options.slice(0, 8);
    return options
      .filter((o) => o.toLowerCase().includes(q))
      .slice(0, 8);
  }, [value, options]);

  return (
    <div className="relative">
      <Input
        label={label}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        error={error}
        required={required}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-auto bg-bg-ice border border-line-strong fade-in shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]">
          {filtered.map((o) => (
            <li
              key={o}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o);
                setOpen(false);
              }}
              className="px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-soft hover:text-text-primary cursor-pointer transition-colors duration-250"
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
