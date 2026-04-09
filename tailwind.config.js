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
          400: '#7c4dc8',
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
        status: {
          pending:        '#ef4444',
          'pending-light':'#fee2e2',
          progress:        '#eab308',
          'progress-light':'#fef9c3',
          done:            '#22c55e',
          'done-light':    '#dcfce7',
        },
        admin: {
          bg:        'var(--admin-bg)',
          card:      'var(--admin-card)',
          elevated:  'var(--admin-elevated)',
          input:     'var(--admin-input)',
          border:    'var(--admin-border)',
          'border-soft': 'var(--admin-border-soft)',
          text:      'var(--admin-text)',
          'text-secondary': 'var(--admin-text-secondary)',
          muted:     'var(--admin-muted)',
          inactive:  'var(--admin-inactive)',
        },
      },
      boxShadow: {
        card:         '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
        elevated:     '0 8px 24px rgba(0,0,0,0.12)',
      },
      animation: {
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':       'fadeIn 0.3s ease',
        'scale-in':      'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'cart-bounce':   'cartBounce 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'float':         'float 3s ease-in-out infinite',
        'badge-bounce':  'badgeBounce 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'check-draw':    'checkDraw 0.3s ease forwards',
        'slide-up-toast':'slideUpToast 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left-toast':'slideLeftToast 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-out':     'toastOut 0.25s ease forwards',
        'pulse-live':    'pulseLive 2s ease-in-out infinite',
        'shimmer':       'shimmer 1.5s infinite linear',
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
        badgeBounce: {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        checkDraw: {
          from: { strokeDashoffset: '20' },
          to:   { strokeDashoffset: '0' },
        },
        slideUpToast: {
          from: { transform: 'translateY(100%)', opacity: 0 },
          to:   { transform: 'translateY(0)',    opacity: 1 },
        },
        slideLeftToast: {
          from: { transform: 'translateX(100%)', opacity: 0 },
          to:   { transform: 'translateX(0)',    opacity: 1 },
        },
        toastOut: {
          from: { opacity: 1, transform: 'translateY(0)' },
          to:   { opacity: 0, transform: 'translateY(8px)' },
        },
        pulseLive: {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.4 },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};
