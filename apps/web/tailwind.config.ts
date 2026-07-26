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
        success: "var(--success)",
        danger: "var(--danger)",
        warning: "var(--warning)",
      },
      boxShadow: {
        /* Claymorphism: puffy outer drop + soft ambient. Aliases kept so existing
           component classes (shadow-glow-teal, shadow-glass) inherit the clay look. */
        "clay": "var(--clay-shadow)",
        "clay-sm": "var(--clay-shadow-sm)",
        "clay-inset": "var(--clay-shadow-inset)",
        "glow-teal": "var(--clay-shadow)",
        "glow-teal-strong": "0 12px 32px var(--accent-glow), var(--clay-shadow)",
        "glow-strong": "0 12px 32px var(--accent-glow), var(--clay-shadow)",
        "glass": "var(--clay-shadow)",
        "glass-lg": "var(--clay-shadow)",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        "slide-up": "slide-up 0.3s ease-out both",
      },
      borderRadius: {
        /* Clay wants generously rounded corners for that soft, moldable feel. */
        "xl": "18px",
        "2xl": "24px",
      }
    }
  },
  plugins: []
};

export default config;
