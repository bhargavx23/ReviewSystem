/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        // Keep slate for neutrals, reuse Tailwind's defaults where sensible
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        indigo: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        // Modernized primary and accent using Tailwind's curated palettes
        primary: colors.violet,
        accent: colors.teal,
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "stagger-pop": "staggerPop 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        "pulse-gentle": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      boxShadow: {
        modern:
          "0 20px 25px -5px rgba(0, 0,0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "glow-primary":
          "0 0 0 1px rgba(124, 58, 237, 0.08), 0 20px 25px -5px rgba(124, 58, 237, 0.08)",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      borderRadius: {
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        modern: {
          primary: "#5A67D8",
          "primary-focus": "#4C51BF",
          "primary-content": "#ffffff",

          secondary: "#48BB78",
          "secondary-focus": "#38A169",
          "secondary-content": "#ffffff",

          accent: "#ED8936",
          "accent-focus": "#DD6B20",
          "accent-content": "#ffffff",

          neutral: "#4A5568",
          "neutral-focus": "#2D3748",
          "neutral-content": "#ffffff",

          "base-100": "#F7FAFC",
          "base-200": "#EDF2F7",
          "base-300": "#E2E8F0",
          "base-content": "#1A202C",

          info: "#4299E1",
          success: "#38A169",
          warning: "#ED8936",
          error: "#E53E3E",
        },
      },
      "light",
    ],
    darkTheme: false,
    base: true,
    utils: true,
    logs: false,
  },
};
