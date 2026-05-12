import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function onlyDigits(v: string): string {
  return (v || "").replace(/\D/g, "");
}

function isValidCpf(cpf: string): boolean {
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
  return rev === parseInt(d[10]);
}

export async function GET(
  _req: Request,
  ctx: { params: { cpf: string } },
) {
  const cpf = onlyDigits(ctx.params.cpf);

  if (!isValidCpf(cpf)) {
    return NextResponse.json(
      { ok: false, error: "CPF inválido. Verifique e tente novamente." },
      { status: 400 },
    );
  }

  const token = process.env.CPF_API_TOKEN;
  const baseUrl = process.env.CPF_API_URL || "https://apicpf.com/api/consulta";

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Serviço de validação indisponível." },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`${baseUrl}?cpf=${cpf}`, {
      headers: { "X-API-KEY": token },
      cache: "no-store",
    });

    if (res.status === 404) {
      return NextResponse.json(
        { ok: false, error: "CPF não encontrado na base." },
        { status: 404 },
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "Falha na consulta. Tente novamente em instantes." },
        { status: 502 },
      );
    }

    const json = await res.json().catch(() => ({}));
    const data = json?.data ?? json ?? {};

    return NextResponse.json({
      ok: true,
      nome: data?.nome ?? data?.name ?? undefined,
      data_nascimento:
        data?.data_nascimento ?? data?.nascimento ?? data?.birth_date ?? undefined,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Não foi possível validar o CPF agora." },
      { status: 502 },
    );
  }
}
