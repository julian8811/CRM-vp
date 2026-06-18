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
        stitch: {
          bg: '#031427',
          surface: '#111827',
          'surface-elevated': '#1b2b3f',
          border: '#1e293b',
          primary: '#b3c5ff',
          'primary-bright': '#5f8bff',
          action: '#3B82F6',
          text: '#d3e4fe',
          muted: '#8c90a1',
          success: '#4ade80',
          warning: '#fbbf24',
          danger: '#f87171',
        },
        surface: {
          light: '#f8fafc',
          dark: '#031427',
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
        'card-hover': '0 10px 40px rgba(0,0,0,0.12)',
        'dropdown': '0 4px 20px rgba(0,0,0,0.15)',
        'glow': '0 0 20px rgba(95, 139, 255, 0.25)',
      },
      backgroundImage: {
        'stitch-gradient': 'linear-gradient(135deg, #031427 0%, #0f2035 50%, #1B3A5C 100%)',
      },
    },
  },
  plugins: [],
}
