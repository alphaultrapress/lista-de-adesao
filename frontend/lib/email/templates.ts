import { assinaturaHtml } from "./assinatura";

/* ══════════════════════════════════════════════════════════════════════════
   Modelos dos e-mails automáticos.

   Regras de e-mail que o layout obedece (não são preferência, são o que os
   clientes de e-mail suportam): tabela em vez de flex/grid, estilo inline em
   vez de <style>, largura máxima de 600px e nenhuma imagem indispensável para
   entender a mensagem — muita gente lê com imagens bloqueadas.
   ══════════════════════════════════════════════════════════════════════════ */

export type Modelo = { assunto: string; html: string };

type Turma = {
  nome: string;
  curso: string;
  instituicao: string;
  convites: number;
  adesoes: number;
  meta: number;
  link: string;
};

const primeiroNome = (nome: string) => (nome || "").trim().split(/\s+/)[0] || "";

/** Moldura comum: corpo branco, texto escuro e a assinatura no pé. */
function moldura(base: string, conteudo: string) {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#F2F1EE;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#F2F1EE;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E3E4DF;">
<tr><td style="padding:36px 36px 8px 36px;font-family:Arial,Helvetica,sans-serif;color:#171816;font-size:16px;line-height:1.55;">
${conteudo}
</td></tr>
<tr><td style="padding:24px 36px 32px 36px;">
${assinaturaHtml(base)}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** Botão em tabela: <a> estilizado some no Outlook. */
function botao(href: string, texto: string) {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:26px 0 8px 0;">
<tr><td style="background:#111210;">
<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:#FFFFFF;text-decoration:none;">${texto}</a>
</td></tr></table>`;
}

/* ── 1. A lista parou de crescer ───────────────────────────────────────── */
export function listaParada(t: Turma, base: string, diasParada: number): Modelo {
  const faltam = Math.max(0, t.meta - t.convites);
  const nunca = t.adesoes <= 1;

  const corpo = nunca
    ? `<p style="margin:0 0 16px 0;">Oi, ${primeiroNome(t.nome)}!</p>
<p style="margin:0 0 16px 0;">A lista da <strong>${t.curso}</strong> está no ar há ${diasParada} dias, mas até agora só com você nela.</p>
<p style="margin:0 0 16px 0;">Basta mandar o link no grupo da turma. Quanto mais formandos entram, melhores as condições que conseguimos fechar — o valor por convite cai conforme a turma cresce.</p>`
    : `<p style="margin:0 0 16px 0;">Oi, ${primeiroNome(t.nome)}!</p>
<p style="margin:0 0 16px 0;">A lista da <strong>${t.curso}</strong> está parada há ${diasParada} dias, com <strong>${t.convites} convites</strong> confirmados.</p>
<p style="margin:0 0 16px 0;">Faltam ${faltam} para bater a meta e a nossa equipe entrar com a proposta. Uma segunda passada no grupo costuma render mais que a primeira.</p>`;

  return {
    assunto: nunca
      ? `A lista da ${t.curso} está esperando a turma`
      : `${t.convites} de ${t.meta} na lista da ${t.curso}`,
    html: moldura(base, corpo + botao(t.link, "Compartilhar com a turma")),
  };
}

/* ── 2. Bateu a meta e ninguém atendeu (aviso interno) ─────────────────── */
export function metaSemAtendimento(t: Turma, base: string, diasEsperando: number): Modelo {
  const corpo = `<p style="margin:0 0 16px 0;font-size:14px;color:#6F716B;">Aviso automático — lista de adesão</p>
<p style="margin:0 0 16px 0;">A turma abaixo bateu a meta e <strong>ainda não foi marcada como atendida</strong>.</p>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;">
<tr><td style="padding:8px 0;border-bottom:1px solid #E3E4DF;color:#6F716B;width:150px;">Representante</td><td style="padding:8px 0;border-bottom:1px solid #E3E4DF;"><strong>${t.nome}</strong></td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #E3E4DF;color:#6F716B;">Turma</td><td style="padding:8px 0;border-bottom:1px solid #E3E4DF;">${t.curso} · ${t.instituicao}</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #E3E4DF;color:#6F716B;">Convites</td><td style="padding:8px 0;border-bottom:1px solid #E3E4DF;">${t.convites} · ${t.adesoes} ades${t.adesoes === 1 ? "ão" : "ões"}</td></tr>
<tr><td style="padding:8px 0;color:#6F716B;">Esperando há</td><td style="padding:8px 0;"><strong>${diasEsperando} dias</strong></td></tr>
</table>
<p style="margin:16px 0 0 0;">Este aviso se repete a cada 5 dias até a turma ser marcada como atendida no painel.</p>`;

  return {
    assunto: `[Atendimento pendente] ${t.curso} — ${diasEsperando} dias esperando`,
    html: moldura(base, corpo + botao(`${base}/admin/representantes`, "Abrir o painel")),
  };
}

/* ── 3. Meta atingida por uma única adesão ─────────────────────────────── */
export function metaUmaAdesao(t: Turma, base: string): Modelo {
  const corpo = `<p style="margin:0 0 16px 0;">${primeiroNome(t.nome)}, a sua turma chegou aos ${t.meta} convites.</p>
<p style="margin:0 0 16px 0;">Só que eles vieram de uma adesão só — a sua. E é justamente aí que mora a diferença: o valor do convite não cai pelo número na lista, cai pelo tanto de formandos negociando juntos.</p>
<p style="margin:0 0 16px 0;">Com a turma reunida, o consultor da Alpha chega com uma proposta bem melhor do que a que conseguimos montar para uma pessoa sozinha. E a lista continua aberta: cada colega que entra agora fortalece a negociação de vocês.</p>
<p style="margin:0 0 16px 0;">Manda o link no grupo da <strong>${t.curso}</strong>:</p>`;

  return {
    assunto: `A ${t.curso} bateu os ${t.meta} convites — e ainda dá para ir além`,
    html: moldura(base, corpo + botao(t.link, "Chamar a turma")),
  };
}
