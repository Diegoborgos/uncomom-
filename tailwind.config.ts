import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        border: "var(--border)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "accent-green": "var(--accent-green)",
        "accent-warm": "var(--accent-warm)",
        "score-high": "var(--score-high)",
        "score-mid": "var(--score-mid)",
        "score-low": "var(--score-low)",
      },
      fontFamily: {
        serif: ["'Anton'", "'Arial Black'", "sans-serif"],
        mono: ["'GeistMono'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
