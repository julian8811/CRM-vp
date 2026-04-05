/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B3A5C',
          light: '#2E75B6',
          dark: '#0f2035',
        },
        accent: '#3b82f6',
        surface: {
          light: '#f8fafc',
          dark: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
        'card-hover': '0 10px 40px rgba(0,0,0,0.12)',
        'dropdown': '0 4px 20px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
