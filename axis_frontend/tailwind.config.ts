import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Cream colors
    'bg-cream-400', 'bg-cream-500', 'bg-cream-600', 'bg-cream-700',
    'hover:bg-cream-400', 'hover:bg-cream-500',
    'text-cream-400', 'text-cream-500', 'text-cream-600',
    'border-cream-400', 'border-cream-500', 'border-cream-600',
    'ring-cream-500', 'focus:ring-cream-500',
    // Cream with opacity
    'bg-cream-500/10', 'bg-cream-500/20', 'bg-cream-500/30',
    'border-cream-500/20', 'border-cream-500/30',
    'from-cream-500/20', 'to-cream-600/20',
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#100f0a',
        'bg-primary': 'rgb(var(--bg-primary) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--bg-secondary) / <alpha-value>)',
        'bg-tertiary': 'rgb(var(--bg-tertiary) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--text-tertiary) / <alpha-value>)',
        'cream': {
          DEFAULT: '#FDFBD4',
          50: '#FFFEF8',
          100: '#FFFEF0',
          200: '#FFFDE0',
          300: '#FEFCC0',
          400: '#FDFBA0',
          500: '#FDFBD4',
          600: '#F5F3B0',
          700: '#E8E58A',
          800: '#D4D070',
          900: '#B8B550',
          950: '#999830',
        },
      },
      backgroundColor: {
        'theme': 'rgb(var(--bg-primary))',
        'theme-secondary': 'rgb(var(--bg-secondary))',
        'theme-tertiary': 'rgb(var(--bg-tertiary))',
      },
      textColor: {
        'theme': 'rgb(var(--text-primary))',
        'theme-secondary': 'rgb(var(--text-secondary))',
        'theme-tertiary': 'rgb(var(--text-tertiary))',
      },
      borderColor: {
        'theme': 'rgb(var(--border-color))',
      }
    },
  },
  plugins: [],
}

export default config