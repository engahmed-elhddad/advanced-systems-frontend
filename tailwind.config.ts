import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Industrial palette: white, gray, light green
        industrial: {
          white: "#ffffff",
          gray: {
            50: "#f9fafb",
            100: "#f3f4f6",
            200: "#e5e7eb",
            300: "#d1d5db",
            400: "#9ca3af",
            500: "#6b7280",
            600: "#4b5563",
            700: "#374151",
            800: "#1f2937",
            900: "#111827",
          },
          green: {
            50: "#f0fdf4",
            100: "#dcfce7",
            200: "#bbf7d0",
            300: "#86efac",
            400: "#4ade80",
            500: "#22c55e",
            600: "#16a34a",
            700: "#15803d",
            800: "#166534",
            900: "#14532d",
          },
        },
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.06)",
        card: "0 4px 12px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 12px 32px rgba(0, 0, 0, 0.12)",
        "primary-sm": "0 2px 8px rgba(16, 185, 129, 0.25)",
        "primary-md": "0 4px 16px rgba(16, 185, 129, 0.3)",
        "primary-lg": "0 8px 24px rgba(16, 185, 129, 0.2)",
      },
      transitionDuration: {
        200: "200ms",
        250: "250ms",
      },
    },
  },
  plugins: [],
};
export default config;
