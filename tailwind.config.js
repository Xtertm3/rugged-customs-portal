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
        'surface-secondary': '#f0f4ff',
        'primary': '#1e40af',
        'primary-light': '#3b82f6',
        'primary-dark': '#1e3a8a',
        'primary-hover': '#1e3a8a',
        'blue': {
          '400': '#60a5fa',
          '500': '#3b82f6',
          '600': '#2563eb',
          '700': '#1d4ed8',
          '800': '#1e40af',
          '900': '#1e3a8a'
        },
        'gold': {
          '400': '#fbbf24',
          '500': '#f59e0b',
          '600': '#d97706',
          '700': '#b45309'
        },
        'secondary': '#64748b',
        'text-primary': '#1e3a8a',
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