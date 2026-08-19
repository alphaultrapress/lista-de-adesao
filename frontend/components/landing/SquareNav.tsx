"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#acabamentos", label: "Acabamentos" },
  { href: "#galeria", label: "Galeria" },
];

// Barra transparente sobre o vídeo do herói que vira preta sólida ao rolar.
export default function SquareNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-[100] transition-colors duration-500"
      style={{ background: scrolled ? "#000000" : "transparent" }}
    >
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-6">
        {/* O arquivo -trim já vem recortado no exato limite da marca (1948x398),
            então nada de caixa + object-fit: cover para comer transparência —
            a proporção na tela é a do arquivo e a altura sai sozinha do width.
            Sem `unoptimized`: o otimizador do Next reduz com Lanczos e serve
            2x em telas retina, que é o que deixa o "convites" legível. */}
        <Link href="/" aria-label="Alpha Convites" className="block">
          <Image
            src="/logos/logo-white-trim.png"
            alt="Alpha Convites"
            width={1948}
            height={398}
            sizes="(max-width: 640px) 128px, 158px"
            quality={100}
            priority
            className="h-auto w-[128px] sm:w-[158px]"
          />
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13px] font-normal uppercase text-paper/80 transition-colors duration-300 hover:text-paper"
              style={{ letterSpacing: "-0.001em" }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-[13px] font-normal uppercase text-paper transition-opacity duration-300 hover:underline"
            style={{ letterSpacing: "-0.001em" }}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center border border-paper bg-paper px-6 py-3 text-[13px] font-medium uppercase text-obsidian transition-colors duration-300 hover:bg-transparent hover:text-paper"
            style={{ letterSpacing: "0.02em", borderRadius: 0 }}
          >
            Cadastrar
          </Link>
        </div>
      </div>
    </header>
  );
}
