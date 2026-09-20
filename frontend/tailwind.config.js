/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jarvis-blue': '#00d0ff', // Azul ciano clássico
        'jarvis-dark': '#0a0a0a', // Fundo quase preto
      },
    },
  },
  plugins: [],
}