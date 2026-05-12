import { ReactNode } from "react";

type Tone = "neutral" | "gold" | "wine";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral: "border-premium-mid1 text-premium-light2",
  gold: "border-premium-gold text-premium-gold",
  wine: "border-premium-wine text-premium-wine",
};

export default function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[10px] tracking-premium-wide uppercase hairline ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
