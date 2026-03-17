/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clash: {
          dark: '#1e1a17', // Dark background (Dark Elixir)
          wood: '#5e3a21', // Primary Wood
          woodlight: '#8b5a33', // Lighter details
          gold: '#fcd32a', // Primary Gold text/accents
          goldsolid: '#eab308', // Darker gold for borders
          elixir: '#d83df2', // Elixir purple accents
          red: '#e11d48', // Health / Danger
          green: '#22c55e', // Success / Ready
        }
      },
      fontFamily: {
        clash: ['"Supercell-Magic"', '"Impact"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        'clash-btn': '0 4px 0 0 #3b2414',
        'clash-card': '0 6px 0 0 #1e1a17',
        'clash-gold': '0 4px 0 0 #b45309',
      },
      backgroundImage: {
        'clash-pattern': "url('/wood-bg.jpg')",
      }
    },
  },
  plugins: [],
}
