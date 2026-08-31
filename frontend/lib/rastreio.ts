/* ══════════════════════════════════════════════════════════════════════════
   Rastreio do link da turma — lado do navegador.

   Duas responsabilidades, as duas de baixo risco por construção:

   • Marcar os envios: toda vez que o representante dispara o link (WhatsApp,
     cópia, cartaz), sai um evento.
   • Marcar as visitas: quem abre a página de adesão ganha um id anônimo
     guardado no próprio navegador, para o painel conseguir separar "10
     visitas" de "10 pessoas".

   Nada aqui pode derrubar a tela: toda chamada é fire-and-forget e engole o
   próprio erro. Se o rastreio cair, o cadastro continua funcionando igual.
   ══════════════════════════════════════════════════════════════════════════ */

export type TipoEvento =
  | "envio_whatsapp"
  | "envio_copia"
  | "envio_cartaz"
  | "visita"
  | "cadastro"
  | "cadastro_manual";

const CHAVE_VISITANTE = "alpha-visitor-id";
const CHAVE_ULTIMA_VISITA = "alpha-visita";

/** Uma visita só é contada de novo depois desse intervalo. */
const JANELA_VISITA_MS = 30 * 60 * 1000;

/**
 * Id anônimo e estável do navegador.
 *
 * Não é login nem cookie de rastreamento entre sites: fica só no
 * localStorage deste domínio e não guarda nenhum dado pessoal. Se o
 * navegador bloquear o storage (aba anônima, cookies desligados), a função
 * devolve string vazia e o evento entra sem id — vira visita sem dono, que
 * é exatamente o que ela é.
 */
export function idVisitante(): string {
  if (typeof window === "undefined") return "";
  try {
    const salvo = window.localStorage.getItem(CHAVE_VISITANTE);
    if (salvo) return salvo;
    const novo =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(CHAVE_VISITANTE, novo);
    return novo;
  } catch {
    return "";
  }
}

/** Dispara o evento e esquece. Nunca lança. */
function enviar(
  representativeId: string,
  tipo: TipoEvento,
  comVisitante: boolean,
  identificador?: string,
) {
  if (typeof window === "undefined" || !representativeId) return;
  try {
    fetch("/api/rastreio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        representative_id: representativeId,
        tipo,
        ...(comVisitante ? { visitor_id: idVisitante() } : {}),
        ...(identificador ? { identificador } : {}),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* rastreio nunca atrapalha o fluxo principal */
  }
}

/** O representante disparou o link por algum canal. */
export function registrarEnvio(
  representativeId: string,
  tipo: "envio_whatsapp" | "envio_copia" | "envio_cartaz",
) {
  enviar(representativeId, tipo, false);
}

/**
 * Alguém abriu a página de adesão.
 *
 * Com janela de 30 minutos por turma: sem isso, cada recarregamento e cada
 * volta do botão "voltar" viraria uma visita nova e o número deixaria de
 * significar gente.
 */
export function registrarVisita(representativeId: string) {
  if (typeof window === "undefined" || !representativeId) return;
  const chave = `${CHAVE_ULTIMA_VISITA}:${representativeId}`;
  try {
    const ultima = Number(window.localStorage.getItem(chave) || 0);
    if (Date.now() - ultima < JANELA_VISITA_MS) return;
    window.localStorage.setItem(chave, String(Date.now()));
  } catch {
    /* sem storage, conta a visita mesmo assim */
  }
  enviar(representativeId, "visita", true);
}

/**
 * O visitante preencheu o formulário da página pública.
 *
 * Faz duas coisas: tira o navegador da lista de "entrou e não se
 * cadastrou" e marca, pelo e-mail, que essa pessoa chegou sozinha pelo
 * link — é assim que o painel diferencia dela quem o representante
 * cadastrou à mão. Sai depois do insert do aluno dar certo.
 */
export function registrarCadastro(representativeId: string, email: string) {
  enviar(representativeId, "cadastro", true, email);
}

/**
 * O representante adicionou um colega à mão, pelo painel dele.
 *
 * Essa pessoa nunca abriu o link: sem esse evento, ela apareceria no
 * painel sem origem nenhuma e pareceria um cadastro espontâneo.
 */
export function registrarCadastroManual(representativeId: string, email: string) {
  enviar(representativeId, "cadastro_manual", false, email);
}
