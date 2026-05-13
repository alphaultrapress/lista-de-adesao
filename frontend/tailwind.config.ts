import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#F7F7F5",
          white: "#FFFFFF",
          soft: "#F1F1EF",
          ice: "#FBFBF9",
          warm: "#F1F1EF",
        },
        ink: {
          DEFAULT: "#0A0A0A",
          950: "#050505",
          900: "#0A0A0A",
          800: "#111111",
          700: "#1A1A1A",
          600: "#2A2A2A",
        },
        gray: {
          900: "#1A1A1A",
          800: "#2A2A2A",
          500: "#5F5F5F",
          400: "#8A8A8A",
          300: "#CFCFCF",
          200: "#E5E5E3",
        },
        text: {
          primary: "#0A0A0A",
          secondary: "#5F5F5F",
          tertiary: "#8A8A8A",
          inverse: "#F7F7F5",
        },
        line: {
          DEFAULT: "rgba(10,10,10,0.08)",
          strong: "rgba(10,10,10,0.16)",
          inverse: "rgba(255,255,255,0.08)",
          inverseStrong: "rgba(255,255,255,0.14)",
        },
        crimson: {
          DEFAULT: "#6E1414",
          deep: "#5A1010",
          rich: "#7A1C1C",
        },
        wine: {
          DEFAULT: "#6E1414",
          deep: "#5A1010",
          rich: "#7A1C1C",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        "premium-tight": "0em",
        "premium-snug": "0em",
        "premium-wide": "0.18em",
        "premium-widest": "0.36em",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
        tech: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      transitionDuration: {
        250: "250ms",
        350: "350ms",
        450: "450ms",
        600: "600ms",
      },
      backgroundImage: {
        "grid-tech":
          "linear-gradient(rgba(10,10,10,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.04) 1px, transparent 1px)",
        "grid-tech-dark":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "radial-crimson":
          "radial-gradient(ellipse at center, rgba(110,20,20,0.15) 0%, rgba(110,20,20,0) 60%)",
        "radial-fade":
          "radial-gradient(ellipse at top, rgba(10,10,10,0.06) 0%, rgba(10,10,10,0) 70%)",
      },
      animation: {
        "fade-up": "fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fadeIn 1s cubic-bezier(0.22, 1, 0.36, 1) both",
        glow: "glowPulse 4s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        "slow-pan": "slowPan 18s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.48" },
          "50%": { opacity: "0.9" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        slowPan: {
          "0%": { transform: "translate3d(-1%, -1%, 0) scale(1)" },
          "100%": { transform: "translate3d(1%, 1%, 0) scale(1.03)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
