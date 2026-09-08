/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#09080d",
        foreground: "#fcfcfc",
        card: {
          DEFAULT: "#13111a",
          secondary: "#1a1624",
          border: "#262133",
          hover: "#221c30",
        },
        brand: {
          pink: "#f43f5e",
          "pink-light": "#fda4af",
          "pink-glow": "#fb7185",
          "hot-pink": "#ec4899",
          "hot-glow": "#f472b6",
          "deep-pink": "#be185d",
          neon: "#ff2e93",
          gold: "#fbbf24",
          wine: "#881337",
          dark: "#0d0b13",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      boxShadow: {
        "neon-pink": "0 0 25px -4px rgba(244, 63, 94, 0.45)",
        "neon-hot": "0 0 25px -4px rgba(236, 72, 153, 0.5)",
        "neon-wine": "0 0 25px -4px rgba(136, 19, 55, 0.4)",
        "soft-card": "0 10px 30px -10px rgba(0, 0, 0, 0.8)",
      },
      aspectRatio: {
        square: "1 / 1",
      },
    },
  },
  plugins: [],
};
