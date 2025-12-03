import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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