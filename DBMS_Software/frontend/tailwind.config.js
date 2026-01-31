/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: { 600: '#2563eb', 700: '#1d4ed8' },
        slate: { 850: '#172033' },
      },
    },
  },
  plugins: [],
};
