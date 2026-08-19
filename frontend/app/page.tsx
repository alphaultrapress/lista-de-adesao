"use client";

import Link from "next/link";
import { type CSSProperties } from "react";
import SquareNav from "@/components/landing/SquareNav";
import GaleriaMural from "@/components/landing/GaleriaMural";
import {
  Acabamentos,
  ChamadaFinal,
  ComoFunciona,
  FaixaNumeros,
  HeroLanding,
  RodapeLanding,
} from "@/components/landing/SecoesInstitucionais";

/* --------------------------------------------------------------------------
   Landing acromática — referência Squarespace.
   Regras que o layout inteiro obedece:
   · Só preto (#000) e branco (#fff); cinzas apenas para hierarquia de texto.
   · Display em peso 300, tracking -0.06em (Inter substitui a Clarkson).
   · Botões com raio 0; cards com raio 8px; pills com raio 100px.
   · Sem sombra: profundidade vem do contraste entre faixas preta e branca.
   -------------------------------------------------------------------------- */

export default function LandingPage() {
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

      <HeroLanding
        titulo="Sua turma merece um convite inesquecível"
        ctaHref="/cadastro"
        ctaLabel="Criar minha lista"
        apoio="Grátis para criar. Leva menos de dois minutos."
      />

      <FaixaNumeros sobCarrossel />

      <ComoFunciona />

      <Acabamentos />

      {/* ══ GALERIA ══ mural de colunas deslizando, título ao centro */}
      <GaleriaMural />

      <ChamadaFinal titulo="Comece a lista da sua turma hoje">
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
      </ChamadaFinal>

      <RodapeLanding />
    </main>
  );
}
