/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        industrial: {
          bg: '#0a0e17',
          surface: '#101622',
          card: '#131b2a',
          elevated: '#1a2436',
          border: '#1f2b3e',
          'border-light': '#2c3b52',
          muted: '#64748b',
          text: '#f1f5f9',
          'text-dim': '#94a3b8',
          accent: '#2563eb',
          'accent-hover': '#1d4ed8',
          'accent-subtle': 'rgba(37, 99, 235, 0.12)',
        },
        telemetry: {
          good: '#10b981',
          'good-bg': 'rgba(16, 185, 129, 0.10)',
          'good-border': 'rgba(16, 185, 129, 0.30)',
          warn: '#f59e0b',
          'warn-bg': 'rgba(245, 158, 11, 0.10)',
          'warn-border': 'rgba(245, 158, 11, 0.30)',
          crit: '#ef4444',
          'crit-bg': 'rgba(239, 68, 68, 0.10)',
          'crit-border': 'rgba(239, 68, 68, 0.30)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};

