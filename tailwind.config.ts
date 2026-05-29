import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-cormorant)", "serif"],
        body: ["var(--font-jost)", "sans-serif"],
        script: ["var(--font-dancing)", "cursive"],
      },
      colors: {
        rose: {
          25: "#fff7f7",
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
        },
        blush: {
          50: "#fef0f5",
          100: "#fde3ed",
          200: "#fbc8db",
          300: "#f79ab8",
          400: "#f16591",
          500: "#e83d71",
        },
        gold: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
        },
        cream: {
          50: "#fefdf8",
          100: "#fefaed",
          200: "#fdf4d3",
          300: "#fbeaa8",
        },
      },
      animation: {
        "heart-beat": "heartBeat 1.2s ease-in-out infinite",
        "float-up": "floatUp 0.8s ease-out forwards",
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
        shimmer: "shimmer 2s infinite",
        twinkle: "twinkle 1.5s ease-in-out infinite alternate",
        "bounce-gentle": "bounceGentle 2s ease-in-out infinite",
      },
      keyframes: {
        heartBeat: {
          "0%, 100%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.15)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.1)" },
          "70%": { transform: "scale(1)" },
        },
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        twinkle: {
          "0%": { opacity: "0.4", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1.05)" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "rose-glow": "0 0 30px rgba(244, 63, 94, 0.2)",
        "gold-glow": "0 0 30px rgba(234, 179, 8, 0.2)",
        soft: "0 2px 20px rgba(0,0,0,0.06)",
        "soft-lg": "0 8px 40px rgba(0,0,0,0.08)",
        card: "0 4px 24px rgba(251, 113, 133, 0.12)",
        "card-hover": "0 12px 40px rgba(251, 113, 133, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
