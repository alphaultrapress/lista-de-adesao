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
      className={`bg-premium-dark1 hairline border-premium-dark3 p-6 md:p-8 ${className}`}
      {...rest}
    >
      {(title || subtitle) && (
        <header className="mb-6 pb-6 border-b-[0.5px] border-premium-dark3">
          {title && (
            <h3 className="font-serif text-xl text-premium-white tracking-premium-tight">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-xs text-premium-light1">{subtitle}</p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
