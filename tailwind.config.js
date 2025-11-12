/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'background': '#ffffff',
        'surface': '#ffffff',
        'surface-secondary': '#f8fafc',
        'primary': '#f97316',
        'primary-light': '#fb923c',
        'primary-dark': '#ea580c',
        'primary-hover': '#ea580c',
        'orange': {
          '400': '#fb923c',
          '500': '#f97316',
          '600': '#ea580c',
          '700': '#c2410c'
        },
        'secondary': '#64748b',
        'text-primary': '#0f172a',
        'text-secondary': '#64748b',
        'border': '#e2e8f0',
        'border-light': '#f1f5f9',
        'success': '#10b981',
        'error': '#ef4444',
        'warning': '#f59e0b',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
            '0%': { opacity: 0, transform: 'translateY(10px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}