/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gis: {
          'deep-blue': '#1e3a5f',
          'navy': '#0f172a',
          'teal': '#0d9488',
          'teal-light': '#14b8a6',
          'green': '#10b981',
          'green-muted': '#4ade80',
          'amber': '#f59e0b',
          'slate': '#1e293b',
          'panel': '#0f1729',
          'surface': '#162032',
          'border': '#1e3a5f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
