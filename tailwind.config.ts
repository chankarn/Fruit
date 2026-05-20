// File: tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fffdf7',
          100: '#fffbeb',
          200: '#fef3c7',
        },
        mango: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
        },
        lime: {
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
        },
        peach: {
          100: '#ffe4d4',
          200: '#fed4b8',
        },
        income: '#10b981',
        expense: '#f43f5e',
        profit: '#0ea5e9',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Noto Sans Thai',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 8px 24px -12px rgba(249, 115, 22, 0.25)',
        glow: '0 0 0 4px rgba(249, 115, 22, 0.15)',
        float: '0 12px 32px -8px rgba(17, 24, 39, 0.12)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-warm': 'linear-gradient(135deg, #fff7ed 0%, #ffe4d4 100%)',
        'gradient-mango': 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)',
        'gradient-fresh':
          'linear-gradient(135deg, #fed7aa 0%, #fffbeb 50%, #d9f99d 100%)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
