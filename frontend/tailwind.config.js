/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6', // Blue to match the image buttons
          hover: '#2563EB',
        },
        secondary: '#1E293B', // Dark slate for dark mode cards
        success: '#10B981',
        warning: '#F59E0B',
        info: '#3B82F6',
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        pulseOpacity: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: .5 },
        }
      },
      animation: {
        'skeleton': 'pulseOpacity 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
