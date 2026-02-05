/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3730A3",   // Deep Indigo
        secondary: "#10B981", // Emerald
        background: "#F9FAFB",// Off-white
      },
    },
  },
  plugins: [],
}