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
        "glow-teal": "0 0 15px var(--accent-glow)",
        "glow-teal-strong": "0 0 25px var(--accent-glow)",
        "glass": "0 4px 20px rgba(0, 0, 0, 0.4)",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out both",
        "slide-up": "slide-up 0.3s ease-out both",
      },
      borderRadius: {
        /* Bringing border radii down slightly for a more 'flat/professional' look compared to the hyper-round 3xl/4xl */
        "xl": "12px",
        "2xl": "16px",
      }
    }
  },
  plugins: []
};

export default config;
