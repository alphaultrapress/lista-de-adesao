"use client";

import Input from "../ui/Input";
import { maskPhone } from "@/lib/cpf";

interface PhoneInputProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  name?: string;
  variant?: "default" | "auth";
}

export default function PhoneInput({
  value,
  onChange,
  label = "WhatsApp",
  error,
  required,
  name = "whatsapp",
  variant,
}: PhoneInputProps) {
  return (
    <Input
      label={label}
      name={name}
      value={value}
      onChange={(e) => onChange(maskPhone(e.target.value))}
      placeholder="(00) 00000-0000"
      inputMode="tel"
      autoComplete="tel"
      required={required}
      error={error}
      variant={variant}
    />
  );
}
