/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    'animate-spin', 'animate-pulse', 'animate-fade-in', 'animate-slide-up',
    'from-sky-500/20', 'to-sky-600/10', 'border-sky-500/20',
    'from-cyan-500/20', 'to-cyan-600/10', 'border-cyan-500/20',
    'from-emerald-500/20', 'to-emerald-600/10', 'border-emerald-500/20',
    'from-amber-500/20', 'to-amber-600/10', 'border-amber-500/20',
    'from-red-500/20', 'to-red-600/10', 'border-red-500/20',
    'from-purple-500/20', 'to-purple-600/10', 'border-purple-500/20',
    'text-sky-400', 'text-cyan-400', 'text-emerald-400',
    'text-amber-400', 'text-red-400', 'text-purple-400',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        navy: {
          950: '#060d1f',
          900: '#0a1628',
          800: '#0f2040',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.5s ease-out both',
        'slide-up':   'slideUp 0.4s ease-out both',
        'spin':       'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'none' } },
      },
    },
  },
  plugins: [],
}
