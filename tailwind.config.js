/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "bebas-neue": ["var(--font-bebas-neue)", "sans-serif"],
        "exo-2": ["var(--font-exo-2)", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "float-up": {
          "0%": { transform: "translateY(0px)", opacity: 0.2 },
          "50%": { opacity: 0.4 },
          "100%": { transform: "translateY(-20px)", opacity: 0 },
        },
        "pulse-slow": {
          "0%": { opacity: 0.3 },
          "50%": { opacity: 0.4 },
          "100%": { opacity: 0.3 },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fadeOut: {
          "0%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        slideUp: {
          "0%": { transform: "translateY(0)", opacity: 1 },
          "100%": { transform: "translateY(-10px)", opacity: 0 },
        },
        "search-glow": {
          "0%": { boxShadow: "0 0 5px rgba(234,179,8,0.2)" },
          "50%": { boxShadow: "0 0 8px rgba(234,179,8,0.3)" },
          "100%": { boxShadow: "0 0 5px rgba(234,179,8,0.2)" },
        },
        glow: {
          "0%": { opacity: 0.3 },
          "50%": { opacity: 0.6 },
          "100%": { opacity: 0.3 },
        },
        "modal-fade-in": {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        "backdrop-fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "ping-slow": {
          "0%": { transform: "scale(1)", opacity: 1 },
          "50%": { opacity: 0.5 },
          "75%, 100%": { transform: "scale(1.5)", opacity: 0 },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "shine-pulse": {
          "0%": { filter: "brightness(1)" },
          "50%": { filter: "brightness(1.3)" },
          "100%": { filter: "brightness(1)" },
        },
        "particle-1": {
          "0%, 100%": { transform: "translate(0px, 0px)", opacity: 0.8 },
          "50%": { transform: "translate(5px, -5px)", opacity: 0.4 },
        },
        "particle-2": {
          "0%, 100%": { transform: "translate(0px, 0px)", opacity: 0.7 },
          "50%": { transform: "translate(-5px, 5px)", opacity: 0.3 },
        },
        "particle-3": {
          "0%, 100%": { transform: "translate(0px, 0px)", opacity: 0.6 },
          "50%": { transform: "translate(5px, 5px)", opacity: 0.2 },
        },
        "particle-4": {
          "0%, 100%": { transform: "translate(0px, 0px)", opacity: 0.7 },
          "50%": { transform: "translate(-5px, -5px)", opacity: 0.3 },
        },
        "particle-5": {
          "0%, 100%": { transform: "translate(0px, 0px)", opacity: 0.5 },
          "50%": { transform: "translate(8px, 0px)", opacity: 0.2 },
        },
        "particle-6": {
          "0%, 100%": { transform: "translate(0px, 0px)", opacity: 0.6 },
          "50%": { transform: "translate(-8px, 0px)", opacity: 0.3 },
        },
        "micro-particle-1": {
          "0%, 100%": { transform: "translate(0px, 0px)", opacity: 0.4 },
          "50%": { transform: "translate(3px, -3px)", opacity: 0.1 },
        },
        "micro-particle-2": {
          "0%, 100%": { transform: "translate(0px, 0px)", opacity: 0.3 },
          "50%": { transform: "translate(-3px, 3px)", opacity: 0.1 },
        },
        "micro-particle-3": {
          "0%, 100%": { transform: "translate(0px, 0px)", opacity: 0.4 },
          "50%": { transform: "translate(3px, 3px)", opacity: 0.1 },
        },
        "micro-particle-4": {
          "0%, 100%": { transform: "translate(0px, 0px)", opacity: 0.3 },
          "50%": { transform: "translate(-3px, -3px)", opacity: 0.1 },
        },
        "micro-particle-5": {
          "0%, 100%": { transform: "translate(0px, 0px)", opacity: 0.4 },
          "50%": { transform: "translate(4px, 0px)", opacity: 0.1 },
        },
        "light-ray-1": {
          "0%, 100%": { opacity: 0.5, transform: "scaleX(1)" },
          "50%": { opacity: 0.3, transform: "scaleX(1.2)" },
        },
        "light-ray-2": {
          "0%, 100%": { opacity: 0.5, transform: "scaleY(1)" },
          "50%": { opacity: 0.3, transform: "scaleY(1.2)" },
        },
        "float-up-1": {
          "0%": { transform: "translateY(0px)", opacity: 0.3 },
          "100%": { transform: "translateY(-25px)", opacity: 0 },
        },
        "float-up-2": {
          "0%": { transform: "translateY(0px)", opacity: 0.4 },
          "100%": { transform: "translateY(-28px)", opacity: 0 },
        },
        "float-up-3": {
          "0%": { transform: "translateY(0px)", opacity: 0.3 },
          "100%": { transform: "translateY(-22px)", opacity: 0 },
        },
        "float-up-4": {
          "0%": { transform: "translateY(0px)", opacity: 0.2 },
          "100%": { transform: "translateY(-30px)", opacity: 0 },
        },
        "float-up-5": {
          "0%": { transform: "translateY(0px)", opacity: 0.3 },
          "100%": { transform: "translateY(-26px)", opacity: 0 },
        },
        "float-up-slow-1": {
          "0%": { transform: "translateY(0px)", opacity: 0.2 },
          "100%": { transform: "translateY(-18px)", opacity: 0 },
        },
        "float-up-slow-2": {
          "0%": { transform: "translateY(0px)", opacity: 0.2 },
          "100%": { transform: "translateY(-16px)", opacity: 0 },
        },
        "glow-pulse": {
          "0%": { opacity: 0.3 },
          "50%": { opacity: 0.5 },
          "100%": { opacity: 0.3 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float-up": "float-up 8s ease-in infinite",
        "pulse-slow": "pulse-slow 4s ease-in-out infinite",
        fadeIn: "fadeIn 0.3s ease-out forwards",
        fadeOut: "fadeOut 0.3s ease-out forwards",
        slideDown: "slideDown 0.3s ease-out forwards",
        slideUp: "slideUp 0.3s ease-out forwards",
        "search-glow": "search-glow 6s ease-in-out infinite",
        glow: "glow 5s ease-in-out infinite",
        "modal-fade-in": "modal-fade-in 0.3s ease-out",
        "backdrop-fade-in": "backdrop-fade-in 0.2s ease-out",
        "ping-slow": "ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite",
        "bounce-slow": "bounce-slow 2s ease-in-out infinite",
        "shine-pulse": "shine-pulse 2s ease-in-out infinite",
        "particle-1": "particle-1 3s ease-in-out infinite",
        "particle-2": "particle-2 3.5s ease-in-out infinite",
        "particle-3": "particle-3 4s ease-in-out infinite",
        "particle-4": "particle-4 3.8s ease-in-out infinite",
        "particle-5": "particle-5 3.2s ease-in-out infinite",
        "particle-6": "particle-6 3.7s ease-in-out infinite",
        "micro-particle-1": "micro-particle-1 2.5s ease-in-out infinite",
        "micro-particle-2": "micro-particle-2 2.2s ease-in-out infinite",
        "micro-particle-3": "micro-particle-3 2.7s ease-in-out infinite",
        "micro-particle-4": "micro-particle-4 2.4s ease-in-out infinite",
        "micro-particle-5": "micro-particle-5 2.3s ease-in-out infinite",
        "light-ray-1": "light-ray-1 3s ease-in-out infinite",
        "light-ray-2": "light-ray-2 3.5s ease-in-out infinite",
        "float-up-1": "float-up-1 3s ease-out infinite",
        "float-up-2": "float-up-2 2.5s ease-out infinite",
        "float-up-3": "float-up-3 3.2s ease-out infinite",
        "float-up-4": "float-up-4 4s ease-out infinite",
        "float-up-5": "float-up-5 3.7s ease-out infinite",
        "float-up-slow-1": "float-up-slow-1 4.5s ease-out infinite",
        "float-up-slow-2": "float-up-slow-2 5s ease-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
