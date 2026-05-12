import { ReactNode } from "react";

type Tone = "neutral" | "crimson" | "dark";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  neutral: "border-line-strong text-text-secondary bg-white/60 backdrop-blur",
  crimson: "border-crimson/40 text-crimson bg-crimson/[0.04]",
  dark: "border-ink text-ink bg-white/60 backdrop-blur",
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
