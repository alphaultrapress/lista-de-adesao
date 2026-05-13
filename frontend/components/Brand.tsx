import Image from "next/image";
import Link from "next/link";

interface BrandProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  variant?: "light" | "dark";
}

const heights: Record<NonNullable<BrandProps["size"]>, number> = {
  sm: 36,
  md: 52,
  lg: 78,
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
            Tecnologia premium para listas de adesão e relacionamento de turmas
            de formatura.
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
            <a
              href="https://instagram.com/alphaconvites"
              target="_blank"
              rel="noreferrer"
              className="premium-dark-link"
            >
              @alphaconvites
            </a>
            <a
              href="mailto:contato@alphaconvites.com.br"
              className="premium-dark-link"
            >
              contato@alphaconvites.com.br
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
