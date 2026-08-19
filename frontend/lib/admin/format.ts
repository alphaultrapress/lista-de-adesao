/**
 * Datas da área administrativa.
 *
 * O banco guarda `timestamptz` em UTC; aqui a exibição é sempre forçada para
 * America/Sao_Paulo. O `formatDateTimeBr` de `lib/format.ts` usa o fuso da
 * máquina do usuário, então não serve — e não posso trocá-lo porque é usado
 * fora do painel.
 *
 * Nada de data inventada: sem valor confiável, o texto é explícito.
 */
export const SEM_DATA = "Data não disponível";

const FUSO = "America/Sao_Paulo";

function paraData(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `17/08/2026` — usado na coluna da tabela. */
export function dataAdmin(valor: string | null | undefined): string {
  const d = paraData(valor);
  if (!d) return SEM_DATA;
  return d.toLocaleDateString("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** `17/08/2026 às 09:54` — usado no title/hover e nos detalhes. */
export function dataHoraAdmin(valor: string | null | undefined): string {
  const d = paraData(valor);
  if (!d) return SEM_DATA;
  const data = d.toLocaleDateString("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = d.toLocaleTimeString("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${data} às ${hora}`;
}

/** "há 3 dias", para a timeline de atividades. */
export function tempoRelativo(valor: string | null | undefined): string {
  const d = paraData(valor);
  if (!d) return SEM_DATA;
  const seg = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seg < 60) return "agora";
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "há 1 mês" : `há ${meses} meses`;
}

export function numero(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function percentual(n: number, casas = 0): string {
  return `${n.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  })}%`;
}
