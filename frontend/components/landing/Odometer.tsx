"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Número que rola os dígitos ao entrar na tela, como um odômetro.
 *
 * Cada dígito é uma coluna de 0 a 9 dentro de uma janela de 1 linha de altura;
 * a coluna desliza até parar no algarismo certo. As colunas partem com atraso
 * crescente, o que produz o escalonamento da referência.
 */
export default function Odometer({
  value,
  prefix = "",
  suffix,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRolou(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setRolou(true);
        io.disconnect();
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const digitos = String(value).split("");

  return (
    <span ref={ref} className="inline-flex items-baseline">
      {prefix}
      {digitos.map((d, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block overflow-hidden"
          // A janela tem exatamente uma linha; o resto da coluna fica escondido.
          style={{ height: "1em", lineHeight: 1 }}
        >
          <span
            className="block"
            style={{
              // A coluna tem 10 linhas, então subir n/10 da altura total para
              // no algarismo n.
              transform: rolou ? `translateY(-${Number(d) * 10}%)` : "none",
              transition: `transform 1500ms cubic-bezier(0.16, 1, 0.3, 1) ${i * 110}ms`,
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span key={n} className="block" style={{ height: "1em", lineHeight: 1 }}>
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
      {/* Leitores de tela recebem o número pronto, sem as colunas. */}
      <span className="sr-only">
        {prefix}
        {value}
        {suffix ? ` ${suffix}` : ""}
      </span>
    </span>
  );
}
