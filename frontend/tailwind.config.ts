import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fundo principal — branco premium quente
        bg: {
          DEFAULT: "#F8F8F5", // base
          warm: "#F5F5F0",    // hero e seções principais
          soft: "#EFEFEA",    // seções alternadas
          ice: "#FBFBF9",     // cards claros
        },
        // Preto premium (header, footer, botão primário)
        ink: {
          DEFAULT: "#0A0A0A",
          900: "#111111",
          800: "#1A1A1A",
        },
        // Texto
        text: {
          primary: "#111111",
          secondary: "#5C5C5C",
          tertiary: "#8A8A8A",
          inverse: "#F5F5F0",
        },
        // Bordas hairline
        line: {
          DEFAULT: "rgba(0,0,0,0.08)",
          strong: "rgba(0,0,0,0.16)",
          inverse: "rgba(255,255,255,0.10)",
        },
        // Dourado champagne — detalhes premium
        champagne: {
          DEFAULT: "#C8A96E",
          soft: "#D4BC8A",
          deep: "#B8985F",
        },
        // Vermelho premium — somente micro detalhes/erros
        wine: {
          DEFAULT: "#8B1A1A",
          deep: "#6E1E1E",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        "premium-tight": "-0.025em",
        "premium-wide": "0.18em",
        "premium-widest": "0.32em",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        250: "250ms",
        350: "350ms",
      },
    },
  },
  plugins: [],
};

export default config;
