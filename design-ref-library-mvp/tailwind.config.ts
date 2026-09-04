import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17181c",
        muted: "#5b5d66",
        faint: "#8b8d96",
        line: "#e4e2da",
        canvas: "#f7f6f3",
        surface: "#ffffff",
        accent: "#2a4bff",
        "accent-soft": "#eaefff",
        "accent-ink": "#1a2fa8",
      },
      fontFamily: {
        sans: ["'Noto Sans JP'", "'Hiragino Sans'", "sans-serif"],
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
