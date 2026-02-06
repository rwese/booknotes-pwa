/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic colors mapped to CSS variables - using app prefix
        primary: {
          DEFAULT: 'var(--app-primary)',
          hover: 'var(--app-primary-hover)',
        },
        success: 'var(--app-success)',
        warning: 'var(--app-warning)',
        danger: 'var(--app-danger)',
        surface: {
          primary: 'var(--app-surface-primary)',
          secondary: 'var(--app-surface-secondary)',
          tertiary: 'var(--app-surface-tertiary)',
        },
        text: {
          primary: 'var(--app-text-primary)',
          secondary: 'var(--app-text-secondary)',
          muted: 'var(--app-text-muted)',
        },
        border: 'var(--app-border)',
      },
    },
  },
  plugins: [],
}
