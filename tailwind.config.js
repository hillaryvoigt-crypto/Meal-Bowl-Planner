/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bowl: {
          bg: '#F7F5F0',
          card: '#FFFFFF',
          green: '#2D6A4F',
          'green-light': '#52B788',
          coral: '#E76F51',
          amber: '#F4A261',
          muted: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
