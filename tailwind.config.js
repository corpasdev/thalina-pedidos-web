/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4caf50',
          dark: '#2e7d32',
          light: '#81c784'
        }
      }
    }
  },
  plugins: []
}