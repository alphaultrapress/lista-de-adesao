"use client";

import { useEffect, useRef } from "react";

type VantaEffect = {
  destroy: () => void;
};

export default function VantaDots() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let effect: VantaEffect | undefined;
    let cancelled = false;

    async function start() {
      const three = await import("three");
      const vantaWindow = window as typeof window & { THREE?: typeof three };
      vantaWindow.THREE = three;

      const { default: importedDots } = await import(
        "vanta/dist/vanta.dots.min"
      );

      const bundledDots = importedDots as unknown as {
        default?: typeof importedDots;
      };
      const dots = bundledDots.default ?? importedDots;

      if (cancelled || !containerRef.current) return;

      effect = dots({
        el: containerRef.current,
        THREE: three,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        backgroundColor: 0xffffff,
        color: 0x000000,
        color2: 0x000000,
        size: 4.9,
        spacing: 30,
        showLines: false,
      });
    }

    start().catch((error) => {
      console.error("Não foi possível iniciar o efeito Vanta DOTS.", error);
    });

    return () => {
      cancelled = true;
      effect?.destroy();
    };
  }, []);

  return <div ref={containerRef} aria-hidden className="pointer-events-none absolute inset-0 z-0" />;
}
