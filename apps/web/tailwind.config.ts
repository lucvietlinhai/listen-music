import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        card: "var(--card)",
        text: "var(--text)",
        muted: "var(--muted)",
        line: "var(--line)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        success: "var(--success)"
      },
      boxShadow: {
        glow: "0 0 60px rgba(56, 189, 248, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;

