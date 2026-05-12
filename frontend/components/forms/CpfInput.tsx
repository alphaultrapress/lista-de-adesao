"use client";

import { useState } from "react";
import Input from "../ui/Input";
import Spinner from "../ui/Spinner";
import { fetchCpfData, isValidCpf, maskCpf, onlyDigits } from "@/lib/cpf";

interface CpfInputProps {
  value: string;
  onChange: (v: string) => void;
  onResolved?: (data: { nome?: string; data_nascimento?: string }) => void;
  label?: string;
  error?: string;
  name?: string;
  required?: boolean;
}

export default function CpfInput({
  value,
  onChange,
  onResolved,
  label = "CPF",
  error,
  name = "cpf",
  required,
}: CpfInputProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [localError, setLocalError] = useState<string | undefined>();

  async function handleBlur() {
    const digits = onlyDigits(value);
    if (digits.length !== 11) {
      setStatus("idle");
      return;
    }
    if (!isValidCpf(digits)) {
      setStatus("invalid");
      setLocalError("CPF inválido. Verifique e tente novamente.");
      return;
    }
    setLoading(true);
    setLocalError(undefined);
    const data = await fetchCpfData(digits);
    setLoading(false);
    if (!data.ok) {
      setStatus("invalid");
      setLocalError(data.error || "Não foi possível validar o CPF.");
      return;
    }
    setStatus("valid");
    if (onResolved) {
      onResolved({ nome: data.nome, data_nascimento: data.data_nascimento });
    }
  }

  return (
    <Input
      label={label}
      name={name}
      value={value}
      onChange={(e) => {
        setStatus("idle");
        setLocalError(undefined);
        onChange(maskCpf(e.target.value));
      }}
      onBlur={handleBlur}
      placeholder="000.000.000-00"
      inputMode="numeric"
      autoComplete="off"
      required={required}
      error={error || localError}
      rightSlot={
        loading ? (
          <Spinner size={16} className="text-premium-gold" />
        ) : status === "valid" ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="text-premium-gold"
          >
            <path
              d="M5 12l4 4L19 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : status === "invalid" ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className="text-premium-wine"
          >
            <path
              d="M6 6l12 12M6 18L18 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : null
      }
    />
  );
}
