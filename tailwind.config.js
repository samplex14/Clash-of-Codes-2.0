/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clash: {
          dark: "#1e1a17",
          wood: "#5e3a21",
          woodlight: "#8b5a33",
          gold: "#fcd32a",
          goldsolid: "#eab308",
          elixir: "#d83df2",
          red: "#e11d48",
          green: "#22c55e",
        },
      },
      fontFamily: {
        clash: ['"Supercell-Magic"', '"Impact"', "sans-serif"],
        cinzel: ["var(--font-cinzel)", "serif"],
        "cinzel-decorative": ["var(--font-cinzel-decorative)", "cursive"],
        sans: ['"Inter"', "sans-serif"],
      },
      boxShadow: {
        "clash-btn": "0 4px 0 0 #3b2414",
        "clash-card": "0 6px 0 0 #1e1a17",
        "clash-gold": "0 4px 0 0 #b45309",
      },
      backgroundImage: {
        "clash-pattern": "url('/wood-bg.jpg')",
      },
      keyframes: {
        "spin-slow-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        "ping-slow": {
          "0%": { transform: "scale(1)", opacity: "0.3" },
          "100%": { transform: "scale(1.35)", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "spin-slow-reverse": "spin-slow-reverse 2.8s linear infinite",
        "ping-slow": "ping-slow 2s ease-out infinite",
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
