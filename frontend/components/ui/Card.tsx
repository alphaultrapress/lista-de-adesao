import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export default function Card({
  title,
  subtitle,
  children,
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`bg-bg-ice border border-line p-8 md:p-10 card-hover ${className}`}
      {...rest}
    >
      {(title || subtitle) && (
        <header className="mb-8 pb-6 border-b border-line">
          {title && (
            <h3 className="font-serif text-2xl text-text-primary tracking-premium-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
