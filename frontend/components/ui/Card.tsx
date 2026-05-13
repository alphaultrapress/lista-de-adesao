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
      className={`card-hover p-7 md:p-10 ${className}`}
      {...rest}
    >
      {(title || subtitle) && (
        <header className="relative z-10 mb-8 border-b border-line pb-6">
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
      <div className="relative z-10">{children}</div>
    </div>
  );
}
