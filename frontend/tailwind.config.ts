import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        premium: {
          black: "#0A0A0A",
          dark1: "#141414",
          dark2: "#1E1E1E",
          dark3: "#2A2A2A",
          mid1: "#3D3D3D",
          mid2: "#5C5C5C",
          light1: "#A0A0A0",
          light2: "#D4D4D4",
          white: "#F5F5F0",
          gold: "#C8A96E",
          wine: "#8B1A1A",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        "premium-tight": "-0.02em",
        "premium-wide": "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
