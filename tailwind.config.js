/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fredoka One"', 'cursive'],
        body: ['"Nunito"', 'system-ui', 'sans-serif'],
        mono: ['"Nunito"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50:  '#fef9ff',
          100: '#f3e8ff',
          200: '#e0c4f8',
          300: '#b388e8',
          400: '#8a56d4',
          500: '#6b35b8',
          600: '#52278f',
          700: '#3d1a6e',
          800: '#2a0f50',
          900: '#1a0733',
        },
        cream: '#fff8fe',
        gold: '#ff6bcb',
        'gold-light': '#ffd6f0',
        fiesta: {
          magenta: '#ff3dac',
          yellow:  '#ffe135',
          cyan:    '#00d4ff',
          orange:  '#ff7b2e',
          green:   '#39e87b',
          purple:  '#a855f7',
        },
      },
      animation: {
        'slide-up':    'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':     'fadeIn 0.3s ease',
        'scale-in':    'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'cart-bounce': 'cartBounce 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'float':       'float 3s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: 0 },
          to:   { transform: 'translateY(0)',    opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        scaleIn: {
          from: { transform: 'scale(0.92)', opacity: 0 },
          to:   { transform: 'scale(1)',    opacity: 1 },
        },
        cartBounce: {
          '0%':   { transform: 'scale(1)'    },
          '50%':  { transform: 'scale(1.35)' },
          '100%': { transform: 'scale(1)'    },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)'  },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
