import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand greens
        green: {
          50:  "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#22C55E",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
          950: "#052E16",
        },
        // Semantic surface tokens (used via CSS variables)
        brand: {
          primary: "var(--brand-primary)",
          hover:   "var(--brand-hover)",
          subtle:  "var(--brand-subtle)",
          text:    "var(--brand-text)",
        },
        surface: {
          base:     "var(--bg-base)",
          card:     "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
        },
        content: {
          primary:   "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted:     "var(--text-muted)",
          disabled:  "var(--text-disabled)",
        },
        border: {
          DEFAULT: "var(--border-default)",
          strong:  "var(--border-strong)",
          focus:   "var(--border-focus)",
        },
        status: {
          success: "var(--status-success)",
          error:   "var(--status-error)",
          warning: "var(--status-warning)",
          info:    "var(--status-info)",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "sans-serif"],
        mono:    ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        sm:   "4px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        "2xl": "24px",
      },
      boxShadow: {
        sm:    "0 1px 2px 0 rgba(0,0,0,0.05)",
        md:    "0 4px 6px -1px rgba(0,0,0,0.1)",
        lg:    "0 10px 15px -3px rgba(0,0,0,0.1)",
        xl:    "0 20px 25px -5px rgba(0,0,0,0.1)",
        green: "0 0 0 3px rgba(22,163,74,0.25)",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)",   opacity: "1" },
        },
        scaleIn: {
          "0%":   { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
      },
      animation: {
        shimmer:  "shimmer 1.5s infinite",
        "fade-in":  "fadeIn 200ms ease-out",
        "slide-up": "slideUp 250ms ease-out",
        "scale-in": "scaleIn 150ms ease-out",
      },
      transitionDuration: {
        fast:   "100ms",
        normal: "200ms",
        slow:   "350ms",
      },
    },
  },
  plugins: [],
};

export default config;
