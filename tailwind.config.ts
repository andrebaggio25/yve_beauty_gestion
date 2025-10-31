import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#000000',
          hover: '#1a1a1a',
        },
        secondary: {
          DEFAULT: '#6b7280',
          hover: '#4b5563',
        },
        accent: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.06)',
        'hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'card': '0.75rem',
      },
    },
  },
  plugins: [],
}
export default config
