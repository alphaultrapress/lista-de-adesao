export function onlyDigits(v: string): string {
  return (v || "").replace(/\D/g, "");
}

export function maskCpf(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function isValidCpf(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== parseInt(d[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev >= 10) rev = 0;
  if (rev !== parseInt(d[10])) return false;

  return true;
}

export type CpfApiResult = {
  ok: boolean;
  nome?: string;
  data_nascimento?: string;
  error?: string;
};

export async function fetchCpfData(cpf: string): Promise<CpfApiResult> {
  const d = onlyDigits(cpf);
  if (!isValidCpf(d)) {
    return { ok: false, error: "CPF inválido. Verifique e tente novamente." };
  }
  try {
    const res = await fetch(`/api/cpf/${d}`);
    const json = await res.json();
    if (!res.ok || !json?.ok) {
      return {
        ok: false,
        error: json?.error || "Não foi possível validar o CPF agora.",
      };
    }
    return {
      ok: true,
      nome: json.nome,
      data_nascimento: json.data_nascimento,
    };
  } catch {
    return { ok: false, error: "Não foi possível validar o CPF agora." };
  }
}

export function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function isValidPhoneBr(v: string): boolean {
  const d = onlyDigits(v);
  return d.length >= 10 && d.length <= 11;
}
