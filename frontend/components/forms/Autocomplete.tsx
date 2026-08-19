"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Input from "../ui/Input";

interface AutocompleteProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options?: string[];
  fetchOptions?: (query: string) => Promise<string[]>;
  placeholder?: string;
  error?: string;
  name?: string;
  required?: boolean;
  minChars?: number;
  variant?: "default" | "auth";
}

export default function Autocomplete({
  label,
  value,
  onChange,
  options,
  fetchOptions,
  placeholder,
  error,
  name,
  required,
  minChars = 2,
  variant,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!fetchOptions) return;
    const q = value.trim();
    if (q.length < minChars) {
      setRemote([]);
      setLoading(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchOptions(q);
        setRemote(res);
      } catch {
        setRemote([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchOptions, minChars]);

  const filtered = useMemo(() => {
    if (fetchOptions) return remote.slice(0, 10);
    const list = options || [];
    const q = value.toLowerCase().trim();
    if (!q) return list.slice(0, 8);
    return list.filter((o) => o.toLowerCase().includes(q)).slice(0, 8);
  }, [value, options, fetchOptions, remote]);

  const showDropdown = open && (loading || filtered.length > 0);

  return (
    <div className="relative" style={{ zIndex: open ? 50 : "auto" }}>
      <Input
        label={label}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        error={error}
        required={required}
        variant={variant}
        autoComplete="off"
      />
      {showDropdown && (
        <ul
          className={`absolute left-0 right-0 mt-1 max-h-56 overflow-auto border fade-in ${
            variant === "auth" ? "rounded-[10px] border-[#D8D4CC]" : "rounded-md border-line-strong"
          }`}
          style={{
            zIndex: 60,
            backgroundColor: variant === "auth" ? "#F8F7F3" : "#ffffff",
            boxShadow:
              "0 12px 32px -8px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          {loading && (
            <li className={`px-4 py-2.5 text-xs uppercase tracking-wider ${variant === "auth" ? "text-[#6F6D68]" : "text-text-tertiary"}`}>
              Buscando…
            </li>
          )}
          {!loading &&
            filtered.map((o) => (
              <li
                key={o}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o);
                  setOpen(false);
                }}
                className={`cursor-pointer px-4 py-2.5 text-sm transition-colors duration-250 ${
                  variant === "auth"
                    ? "text-[#6F6D68] hover:bg-[#EEEAE2] hover:text-[#111210]"
                    : "text-text-secondary hover:bg-bg-soft hover:text-text-primary"
                }`}
              >
                {o}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
