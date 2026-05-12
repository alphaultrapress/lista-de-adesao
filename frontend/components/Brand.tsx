import Image from "next/image";
import Link from "next/link";

interface BrandProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  /** "dark" → logo escura para fundos claros · "light" → logo branca para fundos escuros */
  variant?: "light" | "dark";
}

const heights: Record<NonNullable<BrandProps["size"]>, number> = {
  sm: 32,
  md: 52,
  lg: 88,
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
    <footer className="mt-32 bg-ink text-text-inverse">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Brand size="sm" variant="light" href="" />
          <span className="hidden md:inline text-line-inverse">·</span>
          <span className="hidden md:inline text-xs tracking-premium-wide uppercase text-white/50">
            convites de formatura premium
          </span>
        </div>
        <div className="flex items-center gap-8 text-[11px] tracking-premium-wide uppercase text-white/60">
          <a
            href="https://instagram.com/alphaconvites"
            target="_blank"
            rel="noreferrer"
            className="hover:text-champagne transition-colors duration-250"
          >
            @alphaconvites
          </a>
          <a
            href="mailto:contato@alphaconvites.com.br"
            className="hover:text-champagne transition-colors duration-250"
          >
            Contato
          </a>
        </div>
      </div>
    </footer>
  );
}
