/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
      },
      colors: {
        snap: {
          bg: "#0a0a0f",
          surface: "#12121a",
          card: "#1a1a26",
          border: "#252535",
          accent: "#7c5cfc",
          "accent-bright": "#9d7ffe",
          "accent-glow": "rgba(124,92,252,0.35)",
          cyan: "#00e5ff",
          "cyan-dim": "rgba(0,229,255,0.15)",
          amber: "#ffb800",
          text: "#e8e8f0",
          muted: "#8888a8",
          dim: "#44445a",
        },
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        pulse2: "pulse2 2s ease-in-out infinite",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        float: "float 6s ease-in-out infinite",
        orb: "orb 8s ease-in-out infinite alternate",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulse2: {
          "0%,100%": { opacity: "0.4", transform: "scale(0.97)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        orb: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "100%": { transform: "translate(60px,40px) scale(1.2)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      boxShadow: {
        accent: "0 0 30px rgba(124,92,252,0.4), 0 0 60px rgba(124,92,252,0.15)",
        "accent-sm": "0 0 12px rgba(124,92,252,0.35)",
        cyan: "0 0 20px rgba(0,229,255,0.3)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
