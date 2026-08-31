"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Send,
  UserCheck,
  EyeOff,
  HelpCircle,
  Info,
  Smartphone,
  Monitor,
} from "lucide-react";
import { ADM, RADIUS } from "@/lib/admin/tokens";
import type { RepLinha } from "@/lib/admin/data";
import { dataHoraAdmin, numero, tempoRelativo } from "@/lib/admin/format";
import { formatPhone } from "@/lib/format";
import type { Student } from "@/lib/supabase";
import {
  alunosDaTurma,
  carregarRastreio,
  origemDoCadastro,
  ORIGEM_LABEL,
  type OrigemCadastro,
  type Rastreio,
} from "@/lib/admin/rastreio";
import { ErroBloco, Vazio } from "@/components/admin/Primitivos";

/* ══════════════════════════════════════════════════════════════════════════
   Rastreio do link da turma.

   Responde as quatro perguntas do funil do link, e é honesto sobre a única
   que os dados não alcançam:

     1. Quantas vezes o representante enviou o link  → evento de envio
     2. Quem entrou e se cadastrou                   → lista de alunos
     3. Quem entrou e não se cadastrou               → visita sem cadastro
     4. Quem recebeu e não entrou                    → não é rastreável

   A quarta não tem resposta porque o link é um só para a turma inteira: o
   representante escolhe os contatos dentro do WhatsApp, e nada disso passa
   pelo sistema. A aba explica isso e mostra o que dá para medir no lugar.
   ══════════════════════════════════════════════════════════════════════════ */

type Aba = "envios" | "cadastraram" | "nao_cadastraram" | "nao_entraram";

const ABAS: { chave: Aba; rotulo: string; icone: typeof Send }[] = [
  { chave: "envios", rotulo: "Envios do link", icone: Send },
  { chave: "cadastraram", rotulo: "Entraram e se cadastraram", icone: UserCheck },
  { chave: "nao_cadastraram", rotulo: "Entraram e não se cadastraram", icone: EyeOff },
  { chave: "nao_entraram", rotulo: "Receberam e não entraram", icone: HelpCircle },
];

function Kpi({
  label,
  valor,
  apoio,
  destaque = false,
}: {
  label: string;
  valor: string;
  apoio: string;
  destaque?: boolean;
}) {
  return (
    <div
      className="flex flex-col justify-between px-3.5 py-3"
      style={{
        border: `1px solid ${ADM.border}`,
        borderRadius: 8,
        background: ADM.bg,
        minHeight: 86,
      }}
    >
      <p
        className="truncate text-[10px] uppercase"
        style={{ letterSpacing: "0.1em", color: ADM.textMuted }}
      >
        {label}
      </p>
      <p
        className="font-semibold leading-none"
        style={{
          fontSize: 24,
          letterSpacing: "-0.03em",
          color: destaque ? ADM.success : ADM.text,
        }}
      >
        {valor}
      </p>
      <p className="truncate text-[11.5px]" style={{ color: ADM.textMuted }} title={apoio}>
        {apoio}
      </p>
    </div>
  );
}

/**
 * Selo de origem do cadastro.
 *
 * Nunca depende só da cor — o texto diz tudo sozinho, porque a lista é
 * lida em varredura rápida e vai junto no print que a equipe manda.
 */
const ESTILO_ORIGEM: Record<OrigemCadastro, { cor: string; fundo: string }> = {
  link: { cor: ADM.success, fundo: "rgba(35,122,75,0.10)" },
  manual: { cor: "#2C5AA0", fundo: "rgba(44,90,160,0.09)" },
  representante: { cor: ADM.text, fundo: "rgba(17,18,16,0.07)" },
  desconhecida: { cor: ADM.textMuted, fundo: "rgba(111,113,107,0.10)" },
};

function SeloOrigem({ origem, titulo }: { origem: OrigemCadastro; titulo?: string }) {
  const e = ESTILO_ORIGEM[origem];
  return (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[10.5px] font-medium"
      style={{ background: e.fundo, color: e.cor }}
      title={titulo}
    >
      {ORIGEM_LABEL[origem]}
    </span>
  );
}

/** Bloco de contexto — usado onde o número precisa de uma frase junto. */
function Nota({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-2.5 px-3.5 py-3 text-[12.5px] leading-[1.55]"
      style={{
        borderRadius: 8,
        border: `1px solid ${ADM.border}`,
        background: ADM.bg,
        color: ADM.textMuted,
      }}
    >
      <Info size={14} strokeWidth={1.8} className="mt-[2px] shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function LinhaLista({
  titulo,
  detalhe,
  direita,
  direitaApoio,
}: {
  titulo: React.ReactNode;
  detalhe: React.ReactNode;
  direita: React.ReactNode;
  direitaApoio?: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-2.5"
      style={{ borderBottom: `1px solid ${ADM.border}` }}
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium" style={{ color: ADM.text }}>
          {titulo}
        </p>
        <p className="truncate text-[12px]" style={{ color: ADM.textMuted }}>
          {detalhe}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="whitespace-nowrap text-[12.5px]" style={{ color: ADM.text }}>
          {direita}
        </p>
        {direitaApoio && (
          <p className="whitespace-nowrap text-[11.5px]" style={{ color: ADM.textMuted }}>
            {direitaApoio}
          </p>
        )}
      </div>
    </div>
  );
}

export default function RastreioModal({
  linha,
  alunos,
  onClose,
}: {
  linha: RepLinha;
  /** Lista completa de alunos do painel — o filtro por turma é feito aqui. */
  alunos: Student[];
  onClose: () => void;
}) {
  const [dados, setDados] = useState<Rastreio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | undefined>();
  const [aba, setAba] = useState<Aba>("envios");

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await carregarRastreio(linha.id);
        if (vivo) setDados(r);
      } catch (err: any) {
        if (vivo) setErro(err?.message || "Não foi possível carregar o rastreio.");
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [linha.id]);

  useEffect(() => {
    const fechar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [onClose]);

  const daTurma = useMemo(() => alunosDaTurma(alunos, linha.id), [alunos, linha.id]);

  const enviosPorCanal = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const e of dados?.envios ?? []) mapa[e.canal] = (mapa[e.canal] || 0) + 1;
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }, [dados]);

  /** A lista da turma já classificada, com o resumo por origem. */
  const classificados = useMemo(() => {
    const mapa = dados?.origemPorEmail ?? new Map();
    const itens = daTurma.map((a) => ({
      aluno: a,
      ...origemDoCadastro(a.email, linha.email, mapa),
    }));
    const resumo: Record<OrigemCadastro, number> = {
      link: 0,
      manual: 0,
      representante: 0,
      desconhecida: 0,
    };
    for (const i of itens) resumo[i.origem] += 1;
    return { itens, resumo };
  }, [daTurma, dados, linha.email]);

  const totalEnvios = dados?.envios.length ?? 0;
  const visitas = dados?.visitas ?? 0;
  const pessoas = dados?.pessoas ?? 0;
  const naoCadastraram = dados?.naoCadastraram ?? [];
  const semIdentificacao = dados?.visitasSemIdentificacao ?? 0;

  const conversao =
    dados && pessoas > 0
      ? Math.round((dados.entraramECadastraram / pessoas) * 100)
      : null;

  const contagem: Record<Aba, number> = {
    envios: totalEnvios,
    cadastraram: daTurma.length,
    nao_cadastraram: naoCadastraram.length,
    nao_entraram: 0,
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Rastreio do link"
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="relative flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden border"
        style={{
          background: ADM.surface,
          borderColor: ADM.border,
          borderRadius: RADIUS,
          boxShadow: "0 30px 70px -25px rgba(0,0,0,0.35)",
        }}
      >
        {/* cabeçalho */}
        <div
          className="flex items-start justify-between gap-4 border-b px-5 py-4"
          style={{ borderColor: ADM.border }}
        >
          <div className="min-w-0">
            <p className="text-[15px] font-semibold" style={{ color: ADM.text }}>
              Rastreio do link
            </p>
            <p className="mt-0.5 truncate text-[13px]" style={{ color: ADM.textMuted }}>
              {linha.name} · {linha.course_name} · {linha.institution_name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-black/5"
            style={{ color: ADM.textMuted }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {erro && <ErroBloco mensagem={erro} />}

          {dados?.indisponivel && (
            <div className="mb-4">
              <Nota>{dados.indisponivel}</Nota>
            </div>
          )}

          {carregando ? (
            <p className="py-10 text-center text-[13px]" style={{ color: ADM.textMuted }}>
              Carregando o rastreio…
            </p>
          ) : (
            <>
              {/* os quatro números do funil */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Kpi
                  label="Envios do link"
                  valor={numero(totalEnvios)}
                  apoio={
                    enviosPorCanal.length
                      ? enviosPorCanal.map(([c, n]) => `${c}: ${n}`).join(" · ")
                      : "Nenhum envio registrado"
                  }
                />
                <Kpi
                  label="Visitas"
                  valor={numero(visitas)}
                  apoio={
                    pessoas
                      ? `${numero(pessoas)} ${pessoas === 1 ? "pessoa" : "pessoas"}`
                      : "Ninguém abriu ainda"
                  }
                />
                <Kpi
                  label="Se cadastraram"
                  valor={numero(daTurma.length)}
                  apoio={
                    conversao === null
                      ? "Sem visitas para comparar"
                      : `${conversao}% de quem entrou`
                  }
                  destaque={daTurma.length > 0}
                />
                <Kpi
                  label="Entraram e saíram"
                  valor={numero(naoCadastraram.length)}
                  apoio="Abriram e não preencheram"
                />
              </div>

              {dados?.desde && (
                <p className="mt-2.5 text-[11.5px]" style={{ color: ADM.textMuted }}>
                  Rastreio ativo desde {dataHoraAdmin(dados.desde)}. O que aconteceu
                  antes disso não foi registrado.
                </p>
              )}

              {/* abas */}
              <div
                className="mt-4 flex flex-wrap gap-1.5 border-b pb-3"
                style={{ borderColor: ADM.border }}
              >
                {ABAS.map((a) => {
                  const ativa = a.chave === aba;
                  const I = a.icone;
                  return (
                    <button
                      key={a.chave}
                      type="button"
                      onClick={() => setAba(a.chave)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12.5px] font-medium transition-colors"
                      style={{
                        borderRadius: 7,
                        border: `1px solid ${ativa ? ADM.ink : ADM.border}`,
                        background: ativa ? "rgba(17,18,16,0.04)" : "transparent",
                        color: ativa ? ADM.text : ADM.textMuted,
                      }}
                    >
                      <I size={13} strokeWidth={1.8} />
                      {a.rotulo}
                      {a.chave !== "nao_entraram" && (
                        <span
                          className="rounded px-1.5 text-[11px]"
                          style={{ background: "rgba(17,18,16,0.07)", color: ADM.text }}
                        >
                          {contagem[a.chave]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3">
                {/* ── 1. envios ── */}
                {aba === "envios" &&
                  (dados && dados.envios.length > 0 ? (
                    <>
                      <Nota>
                        Cada linha é uma vez que o representante disparou o link do
                        painel dele — abriu o WhatsApp, copiou o link ou baixou o
                        cartaz com o QR Code. O WhatsApp não devolve confirmação, então
                        aqui consta o disparo, não a leitura da mensagem.
                      </Nota>
                      <div className="mt-3">
                        {dados.envios.map((e) => (
                          <LinhaLista
                            key={e.id}
                            titulo={e.canal}
                            detalhe={dataHoraAdmin(e.quando)}
                            direita={tempoRelativo(e.quando)}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <Vazio
                      titulo="Nenhum envio registrado"
                      detalhe="O representante ainda não disparou o link pelo painel — ou fez isso antes de o rastreio existir."
                    />
                  ))}

                {/* ── 2. entraram e se cadastraram ── */}
                {aba === "cadastraram" &&
                  (daTurma.length > 0 ? (
                    <>
                      <Nota>
                        Todo mundo que está na lista da turma, com o selo de como
                        cada um entrou:{" "}
                        {(
                          ["link", "manual", "representante", "desconhecida"] as OrigemCadastro[]
                        )
                          .filter((k) => classificados.resumo[k] > 0)
                          .map((k) => `${classificados.resumo[k]} ${ORIGEM_LABEL[k].toLowerCase()}`)
                          .join(" · ")}
                        .
                        {classificados.resumo.desconhecida > 0 && (
                          <>
                            {" "}
                            Os sem origem são cadastros anteriores ao rastreio — não dá
                            para saber depois por onde entraram.
                          </>
                        )}
                      </Nota>
                      <div className="mt-3">
                        {classificados.itens.map(({ aluno: a, origem, veioDe }) => (
                          <LinhaLista
                            key={a.id}
                            titulo={
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate">{a.full_name}</span>
                                <SeloOrigem
                                  origem={origem}
                                  titulo={
                                    origem === "link" && veioDe
                                      ? `Abriu o link vindo de ${veioDe}`
                                      : undefined
                                  }
                                />
                              </span>
                            }
                            detalhe={`${a.email} · ${formatPhone(a.phone)}`}
                            direita={`${numero(a.qtd_convites || 0)} ${
                              a.qtd_convites === 1 ? "convite" : "convites"
                            }`}
                            direitaApoio={tempoRelativo(a.created_at)}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <Vazio
                      titulo="Nenhum cadastro nesta turma"
                      detalhe="Ninguém preencheu o formulário do link ainda."
                    />
                  ))}

                {/* ── 3. entraram e não se cadastraram ── */}
                {aba === "nao_cadastraram" &&
                  (naoCadastraram.length > 0 ? (
                    <>
                      <Nota>
                        Abriram a página da turma e foram embora sem preencher. Não há
                        nome nem contato: quem só visita não deixa nenhum dado, então o
                        painel identifica o navegador por um código anônimo — é o que
                        permite saber que a mesma pessoa voltou.
                      </Nota>
                      <div className="mt-3">
                        {naoCadastraram.map((v) => {
                          const I = v.dispositivo === "celular" ? Smartphone : Monitor;
                          return (
                            <LinhaLista
                              key={v.visitorId}
                              titulo={
                                <span className="inline-flex items-center gap-1.5">
                                  <I size={12} strokeWidth={1.8} />
                                  {v.apelido}
                                </span>
                              }
                              detalhe={`Veio de ${v.origem} · primeira visita ${dataHoraAdmin(
                                v.primeira,
                              )}`}
                              direita={`${v.visitas} ${
                                v.visitas === 1 ? "visita" : "visitas"
                              }`}
                              direitaApoio={`última ${tempoRelativo(v.ultima)}`}
                            />
                          );
                        })}
                      </div>
                      {semIdentificacao > 0 && (
                        <p className="mt-3 text-[11.5px]" style={{ color: ADM.textMuted }}>
                          Mais {numero(semIdentificacao)}{" "}
                          {semIdentificacao === 1 ? "visita veio" : "visitas vieram"} de
                          navegador em aba anônima ou com armazenamento bloqueado —
                          contam no total, mas não dá para acompanhar se voltaram.
                        </p>
                      )}
                    </>
                  ) : (
                    <Vazio
                      titulo="Ninguém entrou e saiu sem se cadastrar"
                      detalhe="Ou todo mundo que abriu a página preencheu o formulário, ou a página ainda não recebeu visitas."
                    />
                  ))}

                {/* ── 4. receberam e não entraram ── */}
                {aba === "nao_entraram" && (
                  <div className="space-y-3">
                    <Nota>
                      <strong style={{ color: ADM.text }}>
                        Esse número não existe hoje, e mostrar um chute seria pior que
                        não mostrar nada.
                      </strong>{" "}
                      O link da turma é um só para todo mundo. O representante escolhe
                      os contatos dentro do WhatsApp, e essa escolha não passa pelo
                      sistema — a plataforma não vê para quem ele mandou nem quantas
                      pessoas leram sem clicar.
                    </Nota>

                    <div
                      className="px-4 py-3.5"
                      style={{ borderRadius: 8, border: `1px solid ${ADM.border}` }}
                    >
                      <p
                        className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={{ color: ADM.textMuted }}
                      >
                        O que dá para olhar no lugar
                      </p>
                      <div className="mt-2.5">
                        <LinhaLista
                          titulo="Envios do link"
                          detalhe="Vezes que o representante disparou o link"
                          direita={numero(totalEnvios)}
                        />
                        <LinhaLista
                          titulo="Pessoas que abriram"
                          detalhe="Navegadores distintos que chegaram na página"
                          direita={numero(pessoas)}
                        />
                        <LinhaLista
                          titulo="Pessoas que se cadastraram"
                          detalhe="Preencheram o formulário da turma"
                          direita={numero(daTurma.length)}
                        />
                      </div>
                      <p
                        className="mt-3 text-[12.5px] leading-[1.55]"
                        style={{ color: ADM.textMuted }}
                      >
                        {totalEnvios === 0
                          ? "Sem envio registrado, não há o que comparar ainda."
                          : pessoas === 0
                            ? "O link foi disparado, mas ninguém abriu a página até agora — sinal de que a mensagem não chegou ou não convenceu."
                            : `O representante disparou o link ${numero(totalEnvios)} ${
                                totalEnvios === 1 ? "vez" : "vezes"
                              } e ${numero(pessoas)} ${
                                pessoas === 1 ? "pessoa abriu" : "pessoas abriram"
                              } a página. Um envio costuma alcançar um grupo inteiro, então esses dois números não se dividem um pelo outro.`}
                      </p>
                    </div>

                    <p
                      className="text-[12.5px] leading-[1.55]"
                      style={{ color: ADM.textMuted }}
                    >
                      Para saber nome a nome quem recebeu e não entrou, o representante
                      teria que cadastrar os colegas no painel dele e disparar um link
                      individual para cada um. É uma mudança no fluxo do representante,
                      não só nesta tela.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
