/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060B14',
          900: '#0A0F1D',
          850: '#0D1527',
          800: '#111E38',
          700: '#1A2C50',
          600: '#263D6C',
        },
        hazard: {
          high: '#EF4444',
          medium: '#F59E0B',
          low: '#10B981',
          clear: '#06B6D4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
