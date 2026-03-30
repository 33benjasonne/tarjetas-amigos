import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "card-yellow": "#FBBF24",
        "card-blue": "#3B82F6",
        "card-red": "#EF4444",
        pitch: "#0a0f1a",
        "pitch-light": "#111827",
        "pitch-lighter": "#1f2937",
      },
    },
  },
  plugins: [],
};
export default config;
