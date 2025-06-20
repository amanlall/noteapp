/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // You can add custom theme colors here if needed
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
