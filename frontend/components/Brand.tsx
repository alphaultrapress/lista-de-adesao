import Image from "next/image";
import Link from "next/link";
import { SOCIAL } from "@/lib/social";

interface BrandProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  variant?: "light" | "dark";
}

const heights: Record<NonNullable<BrandProps["size"]>, number> = {
  sm: 36,
  md: 52,
  lg: 92,
};

export function Brand({
  size = "md",
  href = "/",
  variant = "dark",
}: BrandProps) {
  const src = variant === "light" ? "/logos/logo-white.png" : "/logos/logo-dark.png";
  const h = heights[size];

  const content = (
    <span
      className="brand-lockup inline-flex items-center select-none"
      aria-label="Alpha Convites"
    >
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

const footerLinks = [
  { href: "/", label: "Início" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/cadastro", label: "Cadastro" },
  { href: "/login", label: "Login" },
];

export function Footer() {
  return (
    <footer id="footer" className="footer-premium">
      <div className="footer-grid-layer" />
      <div className="footer-noise cinematic-noise" />
      <div className="footer-glow" />

      <div className="footer-inner">
        <div className="footer-brand-column">
          <Brand size="lg" variant="light" href="" />
          <p>
            Tecnologia premium para Lista de Interesse e relacionamento com
            turmas de formatura
          </p>
        </div>

        <div className="footer-column">
          <p className="footer-title">Navegação</p>
          <nav>
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="premium-dark-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="footer-column">
          <p className="footer-title">Contato</p>
          <nav>
            {SOCIAL.instagram && (
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noreferrer"
                className="premium-dark-link inline-flex items-center gap-2"
                aria-label="Instagram da Alpha Convites"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
                @{SOCIAL.instagramHandle}
              </a>
            )}
            {SOCIAL.tiktok && (
              <a
                href={SOCIAL.tiktok}
                target="_blank"
                rel="noreferrer"
                className="premium-dark-link inline-flex items-center gap-2"
                aria-label="TikTok da Alpha Convites"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1Z" />
                </svg>
                TikTok
              </a>
            )}
            <a
              href="mailto:marketing@alphaeditora.com.br"
              className="premium-dark-link"
            >
              marketing@alphaeditora.com.br
            </a>
          </nav>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Alpha Convites. Todos os direitos reservados.</p>
        <p className="footer-status">
          <span />
          Plataforma operando
        </p>
      </div>
    </footer>
  );
}
