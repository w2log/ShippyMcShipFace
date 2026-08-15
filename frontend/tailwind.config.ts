import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        surface: '#0a0a0a',
        border: '#1a1a1a',
        'border-subtle': '#111111',
        'text-primary': '#ffffff',
        'text-secondary': '#888888',
        'text-muted': '#444444',
        accent: '#ffffff',
        'accent-dim': '#333333',
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config
