import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        asi: {
          primary: "var(--color-primary)",
          accent: "var(--color-accent)",
          bg: "var(--color-bg)",
          surface: "var(--color-surface)",
          muted: "var(--text-secondary)",
        },
        // industrial = legacy; prefer primary-* in new code
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
        /** Industrial blue accent (RS/Siemens style) */
        accent: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "asi-md": "var(--radius-md)",
        "asi-lg": "var(--radius-lg)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        /** Premium marketing surfaces */
        "premium-sm":
          "0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px -6px rgba(0,0,0,0.45)",
        "premium-md":
          "0 1px 0 rgba(255,255,255,0.08) inset, 0 0 0 1px rgba(255,255,255,0.08), 0 16px 48px -12px rgba(0,0,0,0.5), 0 0 60px -20px rgba(255,122,0,0.12)",
        "premium-lg":
          "0 1px 0 rgba(255,255,255,0.1) inset, 0 0 0 1px rgba(255,255,255,0.09), 0 24px 64px -16px rgba(0,0,0,0.55), 0 0 100px -24px rgba(255,122,0,0.16), 0 0 120px -40px rgba(139,92,246,0.1)",
        "focus-search":
          "0 1px 0 rgba(255,255,255,0.12) inset, 0 0 0 1px rgba(255,160,80,0.4), 0 0 0 4px rgba(255,122,0,0.14), 0 20px 56px -8px rgba(0,0,0,0.5), 0 0 80px -16px rgba(255,122,0,0.2)",
        "glow-orange": "0 0 32px rgba(255, 122, 0, 0.22), 0 0 64px rgba(255, 122, 0, 0.08)",
        "glow-purple": "0 0 40px rgba(147, 51, 234, 0.18), 0 0 80px rgba(147, 51, 234, 0.06)",
        "glow-subtle": "0 0 24px rgba(255, 255, 255, 0.06)",
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
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        scrollProducts: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        scroll: "scrollProducts 30s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
