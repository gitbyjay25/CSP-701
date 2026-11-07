/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        studio: '#e8e6e0',
        lcd: '#ed9f3b',
        'lcd-panel': '#efa544',
        'lcd-ink': '#241c0e',
        'lcd-muted': '#59401b',
        'lcd-border': '#8d6329',
        'paper-bg': '#fcfbf7',
        'paper-edge': '#e3dec3',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        display: ['Silkscreen', 'monospace'],
        brand: ['Manrope', 'sans-serif'],
      },
      animation: {
        'paper-feed': 'paperFeed 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'stamp-slam': 'stampSlam 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'roller-spin': 'rollerSpin 0.8s linear',
      },
      keyframes: {
        paperFeed: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translateY(0%)', opacity: '1' },
        },
        stampSlam: {
          '0%': { transform: 'scale(2.5) rotate(-8deg)', opacity: '0' },
          '60%': { transform: 'scale(0.92) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-1.5deg)', opacity: '0.96' },
        },
        rollerSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(720deg)' },
        },
      },
    },
  },
  plugins: [],
};

