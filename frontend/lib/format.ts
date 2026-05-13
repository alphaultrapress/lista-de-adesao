import { maskCpf, maskPhone } from "./cpf";

export function formatCpf(value: string | null | undefined): string {
  return value ? maskCpf(value) : "-";
}

export function formatPhone(value: string | null | undefined): string {
  return value ? maskPhone(value) : "-";
}

export function formatDateBr(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

export function formatDateTimeBr(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
