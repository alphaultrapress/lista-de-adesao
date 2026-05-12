import Image from "next/image";
import Link from "next/link";

interface BrandProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  variant?: "light" | "dark";
}

const heights: Record<NonNullable<BrandProps["size"]>, number> = {
  sm: 30,
  md: 48,
  lg: 80,
};

export function Brand({
  size = "md",
  href = "/",
  variant = "dark",
}: BrandProps) {
  const src = variant === "light" ? "/logos/logo-white.png" : "/logos/logo-dark.png";
  const h = heights[size];

  const content = (
    <span className="inline-flex items-center select-none" aria-label="Alpha Convites">
      <Image
        src={src}
        alt="Alpha Convites"
        width={h * 3}
        height={h}
        priority={size === "lg"}
        style={{ height: h, width: "auto" }}
      />
    </span>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export function Footer() {
  return (
    <footer className="relative bg-ink-950 text-text-inverse overflow-hidden">
      {/* Grid técnico sutil no fundo */}
      <div className="absolute inset-0 bg-grid-dark opacity-60 pointer-events-none" />
      {/* Glow crimson na base */}
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] glow-crimson-soft pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div>
            <Brand size="md" variant="light" href="" />
            <p className="mt-5 text-[11px] tracking-premium-wide uppercase text-white/40 max-w-xs">
              Convites de formatura premium · Lista de adesão para turmas
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <p className="text-[10px] tracking-premium-widest uppercase text-white/30">
              Contato
            </p>
            <div className="flex flex-col md:items-end gap-2 text-sm text-white/70">
              <a
                href="https://instagram.com/alphaconvites"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors duration-250"
              >
                @alphaconvites
              </a>
              <a
                href="mailto:contato@alphaconvites.com.br"
                className="hover:text-white transition-colors duration-250"
              >
                contato@alphaconvites.com.br
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 hairline-divider-dark" />
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] tracking-premium-wide uppercase text-white/30">
          <p>© {new Date().getFullYear()} Alpha Convites · Todos os direitos reservados</p>
          <p className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-crimson" />
            Plataforma operando
          </p>
        </div>
      </div>
    </footer>
  );
}
