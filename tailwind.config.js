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
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        cream: '#f8fafc',
        gold: '#2563eb',
        'gold-light': '#dbeafe',
        fiesta: {
          magenta: '#2563eb',
          yellow:  '#f59e0b',
          cyan:    '#0ea5e9',
          orange:  '#f97316',
          green:   '#22c55e',
          purple:  '#6366f1',
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
