/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class", // Enable dark mode toggle
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "bounce-slow": "bounce 2s infinite",
        "pulse-soft": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      colors: {
        primary: {
          50: "#e0e7ff",
          100: "#c7d2fe",
          200: "#a5b4fd",
          300: "#818cf8",
          400: "#6366f1",
          500: "#4169e1",
          600: "#3650c4",
          700: "#2b3fa0",
          800: "#1e2a6b",
          900: "#111b3f",
        },
        royal: "#4169e1",
        gold: {
          400: "#f59e0b",
          500: "#d97706",
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["royal", "dark", "light", "business"],
    darkTheme: "dark",
    base: true,
    utils: true,
    logs: false,
  },
};
