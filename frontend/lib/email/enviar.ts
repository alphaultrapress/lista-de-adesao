/**
 * Envio via Resend.
 *
 * Chamada direta na API REST em vez do pacote `resend`: é uma requisição só e
 * evita mais uma dependência para manter atualizada.
 */

const ENDPOINT = "https://api.resend.com/emails";

export type Envio = {
  para: string;
  assunto: string;
  html: string;
};

export type ResultadoEnvio =
  | { ok: true; id: string }
  | { ok: false; erro: string };

export async function enviarEmail({ para, assunto, html }: Envio): Promise<ResultadoEnvio> {
  const chave = process.env.RESEND_API_KEY;
  const remetente = process.env.RESEND_FROM_EMAIL;

  if (!chave) return { ok: false, erro: "RESEND_API_KEY ausente" };
  if (!remetente) return { ok: false, erro: "RESEND_FROM_EMAIL ausente" };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: remetente, to: [para], subject: assunto, html }),
    });

    const corpo = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!res.ok) {
      return { ok: false, erro: corpo.message || corpo.name || `HTTP ${res.status}` };
    }
    return { ok: true, id: corpo.id || "" };
  } catch (err) {
    return { ok: false, erro: String((err as Error)?.message || err) };
  }
}
