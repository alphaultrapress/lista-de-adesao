import { ReactNode } from "react";

type Tone = "neutral" | "champagne" | "wine" | "dark";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral: "border-line-strong text-text-secondary",
  champagne: "border-champagne text-champagne-deep",
  wine: "border-wine/30 text-wine",
  dark: "border-ink text-ink",
};

export default function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[10px] tracking-premium-wide uppercase border ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
