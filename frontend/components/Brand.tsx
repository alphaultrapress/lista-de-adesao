import Image from "next/image";
import Link from "next/link";

interface BrandProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  variant?: "light" | "dark";
}

const heights: Record<NonNullable<BrandProps["size"]>, number> = {
  sm: 36,
  md: 56,
  lg: 96,
};

export function Brand({
  size = "md",
  href = "/",
  variant = "light",
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
    <footer className="mt-24 border-t-[0.5px] border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-premium-light1">
        <div className="flex items-center gap-2">
          <span className="font-serif text-premium-white">Alpha Convites</span>
          <span className="text-premium-mid2">·</span>
          <span>convites de formatura premium</span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://instagram.com/alphaconvites"
            target="_blank"
            rel="noreferrer"
            className="hover:text-premium-gold transition-colors tracking-premium-wide uppercase"
          >
            @alphaconvites
          </a>
          <a
            href="mailto:contato@alphaconvites.com.br"
            className="hover:text-premium-gold transition-colors tracking-premium-wide uppercase"
          >
            Contato
          </a>
        </div>
      </div>
    </footer>
  );
}
