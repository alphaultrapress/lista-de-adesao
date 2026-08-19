"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import SquareNav from "@/components/landing/SquareNav";
import HeroCarousel, { SOBRE_VIDEO } from "@/components/landing/HeroCarousel";
import MediaFrame from "@/components/landing/MediaFrame";
import Odometer from "@/components/landing/Odometer";
import Reveal from "@/components/landing/Reveal";
import PhoneVideo from "@/components/landing/PhoneVideo";
import AcabamentosCarousel from "@/components/landing/AcabamentosCarousel";
import GaleriaMural from "@/components/landing/GaleriaMural";
import VantaDots from "@/components/landing/VantaDots";
import {
  HERO_POSTER,
  HERO_VIDEO,
  PASSO_MOCKUPS,
  PASSO_MOCKUPS_DESKTOP,
} from "@/lib/landingMedia";

/* --------------------------------------------------------------------------
   Landing acromática — referência Squarespace.
   Regras que o layout inteiro obedece:
   · Só preto (#000) e branco (#fff); cinzas apenas para hierarquia de texto.
   · Display em peso 300, tracking -0.06em (Inter substitui a Clarkson).
   · Botões com raio 0; cards com raio 8px; pills com raio 100px.
   · Sem sombra: profundidade vem do contraste entre faixas preta e branca.
   -------------------------------------------------------------------------- */

const PASSOS = [
  {
    titulo: "Crie a lista",
    desc: "Você cadastra a turma e recebe o link oficial dela.",
  },
  {
    titulo: "Chame a turma",
    desc: "Cada colega entra pelo link e deixa os dados na mesma lista.",
  },
  {
    titulo: "A lista ganha corpo",
    desc: "Cada colega que entra soma. É o tamanho da turma que abre a negociação.",
  },
  {
    titulo: "Receba as condições",
    desc: "Com a lista fechada, nossa equipe entra em contato com a turma.",
  },
];

const NUMEROS = [
  { end: 30, prefix: "+", suffix: "mil", label: "Turmas atendidas" },
  { end: 50, prefix: "+", suffix: "anos", label: "De história" },
  { end: 30, prefix: "+", suffix: "anos", label: "Com a 2ª geração" },
];

export default function LandingPage() {
  const [dispositivo, setDispositivo] = useState<"mobile" | "desktop">("mobile");
  const mockups =
    dispositivo === "mobile" ? PASSO_MOCKUPS : PASSO_MOCKUPS_DESKTOP;

  // Vídeo manda; o poster cobre enquanto ele não existe. Se nenhum dos dois
  // foi entregue, o quadro do vídeo aparece como placeholder.
  const heroSlot = HERO_VIDEO.ready
    ? HERO_VIDEO
    : HERO_POSTER.ready
      ? HERO_POSTER
      : HERO_VIDEO;

  return (
    <main
      className="min-h-screen bg-paper font-sans text-obsidian selection:bg-obsidian selection:text-paper"
      // Largura da peça do carrossel do herói. Fica aqui porque o carrossel e a
      // faixa preta logo abaixo precisam do mesmo número.
      // 39vw é a largura em que as três peças somadas passam da janela, fazendo
      // as laterais atravessarem a borda da tela como na referência.
      style={{ "--hero-card": "clamp(300px, 39vw, 900px)" } as CSSProperties}
    >
      <SquareNav />

      {/* ══ HERÓI ══ vídeo full-bleed, headline centralizada, botão fantasma */}
      <section className="relative h-[100svh] min-h-[620px] w-full overflow-hidden bg-obsidian">
        <MediaFrame
          slot={heroSlot}
          tone="dark"
          priority
          className="h-full w-full"
          style={{ position: "absolute", inset: 0 }}
        />

        {/* Véu escuro — garante contraste do texto sobre qualquer cena */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
          // Centraliza o texto no espaço que sobra ACIMA do carrossel, em vez
          // de no herói inteiro — senão o botão encosta nas peças.
          style={{
            paddingBottom: `calc(var(--hero-card) * ${SOBRE_VIDEO} + 32px)`,
          }}
        >
          <h1
            className="max-w-[16ch] font-light text-paper"
            style={{
              fontSize: "clamp(40px, 8vw, 72px)",
              lineHeight: 0.93,
              letterSpacing: "-0.06em",
            }}
          >
            Sua turma merece um convite inesquecível
          </h1>

          <Link
            href="/cadastro"
            className="mt-10 inline-flex items-center justify-center border border-paper px-8 py-4 text-[14px] font-normal uppercase text-paper transition-colors duration-300 hover:bg-paper hover:text-obsidian"
            style={{ borderRadius: 0 }}
          >
            Criar minha lista
          </Link>

          <p className="mt-5 text-[13px] font-normal text-paper/80">
            Grátis para criar. Leva menos de dois minutos.
          </p>
        </div>

      </section>

      {/* O carrossel vive FORA do herói: dentro dele o overflow-hidden do vídeo
          cortaria o pé das peças. Aqui ele sobe por cima do vídeo e o restante
          da altura fica sobre a faixa preta, com as peças inteiras. */}
      <HeroCarousel />

      {/* ══ FAIXA PRETA ══ números como elemento dominante */}
      <section
        className="bg-obsidian pb-20 md:pb-[120px]"
        // A parte de baixo das peças do carrossel cai aqui dentro: o topo
        // precisa desse espaço livre para os números não ficarem encobertos.
        // Derivado da mesma constante do carrossel para os dois não brigarem.
        style={{
          paddingTop: `calc(var(--hero-card) * ${1 - SOBRE_VIDEO} + 72px)`,
        }}
      >
        <p className="mb-14 px-6 text-center text-[13px] font-normal text-ash md:mb-20">
          Mais de 30 mil turmas já passaram pela Alpha.
        </p>

        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-16 px-6 md:grid-cols-3 md:gap-8">
          {NUMEROS.map((n) => (
            <div key={n.label} className="text-center">
              <p
                className="flex items-baseline justify-center gap-2 font-light text-paper"
                style={{
                  fontSize: "clamp(64px, 8vw, 96px)",
                  lineHeight: 1,
                  letterSpacing: "-0.06em",
                }}
              >
                <Odometer value={n.end} prefix={n.prefix} suffix={n.suffix} />
                <span
                  className="font-light text-ash"
                  style={{ fontSize: "clamp(18px, 2vw, 26px)", letterSpacing: "-0.04em" }}
                >
                  {n.suffix}
                </span>
              </p>
              <p
                className="mt-5 text-[12px] font-normal uppercase text-ash"
                style={{ letterSpacing: "-0.001em" }}
              >
                {n.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ COMO FUNCIONA ══ faixa branca, cabeçalho centralizado */}
      <section id="como-funciona" className="bg-paper py-20 md:py-[120px]">
        <div className="mx-auto max-w-[1200px] px-6">
          <Reveal className="text-center">
            <h2
              className="font-light text-obsidian"
              style={{
                fontSize: "clamp(34px, 5vw, 56px)",
                lineHeight: 1,
                letterSpacing: "-0.05em",
              }}
            >
              Como funciona
            </h2>
            <p className="mx-auto mt-6 max-w-[520px] text-[15px] font-normal text-ash">
              A lista é da turma inteira. Não dá para reservar um convite
              sozinho. O que vale é quanta gente você traz junto.
            </p>
          </Reveal>

          {/* Alternador de dispositivo — as mesmas telas vistas no celular e no
              computador. Pills no padrão da referência. */}
          <div className="mt-10 flex justify-center">
            <div
              className="inline-flex p-1"
              style={{ borderRadius: 100, background: "#F2F2F2" }}
            >
              {(["mobile", "desktop"] as const).map((d) => {
                const ativo = dispositivo === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDispositivo(d)}
                    aria-pressed={ativo}
                    className="px-5 py-2 text-[13px] font-normal transition-colors duration-300"
                    style={{
                      borderRadius: 100,
                      background: ativo ? "#FFFFFF" : "transparent",
                      color: ativo ? "#000000" : "#898989",
                      boxShadow: ativo ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {d === "mobile" ? "Celular" : "Computador"}
                  </button>
                );
              })}
            </div>
          </div>

          {dispositivo === "mobile" ? (
            <ol className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:mt-14 md:grid-cols-4 md:gap-6">
              {PASSOS.map((passo, i) => (
                <li key={passo.titulo}>
                  <div className="flex h-[clamp(230px,26vw,380px)] items-end justify-center">
                    <Image
                      src={mockups[i].src}
                      alt=""
                      aria-hidden
                      width={mockups[i].width}
                      height={mockups[i].height}
                      sizes="(max-width: 768px) 42vw, 20vw"
                      className="max-h-full w-auto max-w-full object-contain"
                    />
                  </div>
                  <div className="mt-6 border-t border-fog pt-6">
                    <span
                      className="block font-light text-obsidian"
                      style={{ fontSize: 40, lineHeight: 1, letterSpacing: "-0.05em" }}
                    >
                      0{i + 1}
                    </span>
                    <h3
                      className="mt-3 font-normal text-obsidian"
                      style={{ fontSize: 20, lineHeight: 1.2, letterSpacing: "-0.02em" }}
                    >
                      {passo.titulo}
                    </h3>
                    <p className="mt-2 text-[15px] font-normal leading-[1.4] text-ash">
                      {passo.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <ol className="mt-12 grid gap-x-12 gap-y-16 md:mt-14 lg:grid-cols-2">
              {PASSOS.map((passo, i) => {
                const mockup = PASSO_MOCKUPS_DESKTOP[i];
                return (
                  <li key={passo.titulo}>
                    {/* Computadores ganham uma grade própria em duas colunas:
                        cada PNG pode ocupar sua largura natural e a sombra fica
                        fora de qualquer área de corte. */}
                    <div className="flex min-h-[280px] items-center justify-center sm:min-h-[340px]">
                      <Image
                        src={mockup.src}
                        alt=""
                        aria-hidden
                        width={mockup.width}
                        height={mockup.height}
                        sizes="(max-width: 1024px) 100vw, 46vw"
                        className="h-auto w-full max-w-[560px] object-contain"
                      />
                    </div>
                    <div className="border-t border-fog pt-6">
                      <span
                        className="block font-light text-obsidian"
                        style={{ fontSize: 40, lineHeight: 1, letterSpacing: "-0.05em" }}
                      >
                        0{i + 1}
                      </span>
                      <h3
                        className="mt-3 font-normal text-obsidian"
                        style={{ fontSize: 20, lineHeight: 1.2, letterSpacing: "-0.02em" }}
                      >
                        {passo.titulo}
                      </h3>
                      <p className="mt-2 max-w-[42ch] text-[15px] font-normal leading-[1.4] text-ash">
                        {passo.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {/* Celular com o vídeo de "como funciona" ao lado do argumento.
              O aparelho fica no branco da seção: a moldura escura dele só tem
              silhueta forte sobre fundo claro. */}
          <Reveal className="mt-20 md:mt-28">
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
              <div className="flex justify-center md:justify-end">
                <PhoneVideo className="w-full max-w-[290px] md:max-w-[320px]" />
              </div>

              <div className="max-w-[46ch]">
                <p
                  className="text-[12px] font-normal uppercase text-ash"
                  style={{ letterSpacing: "-0.001em" }}
                >
                  Como a Alpha atende
                </p>

                <h3
                  className="mt-4 font-light text-obsidian"
                  style={{
                    fontSize: "clamp(30px, 4vw, 48px)",
                    lineHeight: 1,
                    letterSpacing: "-0.05em",
                  }}
                >
                  Turma grande negocia melhor
                </h3>

                <p className="mt-6 text-[15px] font-normal leading-[1.5] text-ash">
                  A Alpha atende turmas, não pedidos avulsos. A lista fica aberta
                  enquanto a turma cresce. É o tamanho dela que abre espaço para
                  condições melhores e um valor por convite mais baixo.
                </p>

                <p className="mt-4 text-[15px] font-normal leading-[1.5] text-obsidian">
                  Antes de fechar, chame todo mundo.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Único traço editorial em serifa — o "Clarkson Serif" da referência */}
          <p
            className="mx-auto mt-16 max-w-[620px] text-center font-serif text-obsidian md:mt-24"
            style={{ fontSize: 26, lineHeight: 1.2, letterSpacing: "-0.04em" }}
          >
            Chame a turma inteira. Todo mundo ganha com isso.
          </p>
        </div>
      </section>

      {/* ══ ACABAMENTOS ══ cabeçalho em duas colunas + carrossel de cards */}
      <section id="acabamentos" className="bg-paper pb-20 md:pb-[120px]">
        <div className="mx-auto max-w-[1200px] px-6">
          {/* Título à esquerda e texto à direita, como na referência — o
              cabeçalho centralizado das outras seções não cabe aqui, porque a
              linha de cards logo abaixo já é assimétrica. */}
          <Reveal className="mb-12 grid grid-cols-1 items-end gap-6 md:mb-16 md:grid-cols-2 md:gap-16">
            <h2
              className="font-light text-obsidian"
              style={{
                fontSize: "clamp(34px, 5vw, 56px)",
                lineHeight: 1,
                letterSpacing: "-0.05em",
              }}
            >
              Tudo que dá
              <br />
              caráter ao convite
            </h2>
            <p className="max-w-[46ch] text-[15px] font-normal leading-[1.5] text-ash md:pb-2">
              São sete acabamentos que mudam como o convite é visto e sentido na
              mão. A turma escolhe a combinação junto com a nossa equipe.
            </p>
          </Reveal>

          <AcabamentosCarousel />
        </div>
      </section>

      {/* ══ GALERIA ══ mural de colunas deslizando, título ao centro */}
      <GaleriaMural />

      {/* ══ CHAMADA FINAL ══ pontos Vanta como plano de fundo */}
      <section className="relative overflow-hidden bg-paper">
        <VantaDots />

        <div className="relative z-10 flex flex-col items-center px-6 py-24 text-center md:py-[160px]">
          <h2
            className="max-w-[14ch] font-light text-obsidian"
            style={{
              fontSize: "clamp(36px, 6vw, 64px)",
              lineHeight: 0.93,
              letterSpacing: "-0.06em",
            }}
          >
            Comece a lista da sua turma hoje
          </h2>
          <Link
            href="/cadastro"
            className="mt-10 inline-flex items-center justify-center border border-obsidian bg-obsidian px-8 py-4 text-[13px] font-medium uppercase text-paper transition-colors duration-300 hover:bg-paper hover:text-obsidian"
            style={{ borderRadius: 0, letterSpacing: "0.02em" }}
          >
            Criar minha lista
          </Link>
          <p className="mt-5 text-[13px] font-normal text-ash">
            Sem custo e sem compromisso.
          </p>
        </div>
      </section>

      {/* ══ RODAPÉ ══ */}
      <footer className="border-t border-white/10 bg-obsidian">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 py-16 md:flex-row md:justify-between">
          <div className="max-w-[320px]">
            {/* Mesma marca e mesma medida do cabecalho (ver SquareNav): arquivo
                ja recortado, proporcao real do arquivo e otimizacao do Next
                ligada — cabecalho e rodape crescem sempre juntos. */}
            <Image
              src="/logos/logo-white-trim.png"
              alt="Alpha Convites"
              width={1948}
              height={398}
              sizes="(max-width: 640px) 128px, 158px"
              quality={100}
              className="h-auto w-[128px] sm:w-[158px]"
            />
            <p className="mt-6 text-[13px] font-normal leading-[1.4] text-ash">
              Lista de interesse e relacionamento com turmas de formatura.
            </p>
          </div>

          <div className="flex gap-16">
            <nav className="flex flex-col gap-3">
              <p className="text-[12px] font-normal uppercase text-ash">Navegação</p>
              <a href="#como-funciona" className="text-[13px] text-paper hover:underline">
                Como funciona
              </a>
              <a href="#acabamentos" className="text-[13px] text-paper hover:underline">
                Acabamentos
              </a>
              <Link href="/cadastro" className="text-[13px] text-paper hover:underline">
                Cadastrar
              </Link>
              <Link href="/login" className="text-[13px] text-paper hover:underline">
                Entrar
              </Link>
            </nav>

            <div className="flex flex-col gap-3">
              <p className="text-[12px] font-normal uppercase text-ash">Contato</p>
              <a
                href="mailto:marketing@alphaeditora.com.br"
                className="text-[13px] text-paper hover:underline"
              >
                marketing@alphaeditora.com.br
              </a>
              <Link href="/privacidade" className="text-[13px] text-paper hover:underline">
                Privacidade
              </Link>
              <Link href="/termos" className="text-[13px] text-paper hover:underline">
                Termos
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <p className="mx-auto max-w-[1200px] px-6 py-6 text-[12px] font-normal text-ash">
            &copy; 2026 Alpha Convites. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
