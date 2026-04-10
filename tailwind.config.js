/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        ink: { DEFAULT: '#0a0a0f', 2: '#12121a', 3: '#1c1c2a' },
        surface: { DEFAULT: '#1e1e2e', 2: '#252538' },
        violet: { DEFAULT: '#7c5cfc', light: '#9d82ff' },
        amber: { DEFAULT: '#f5a623' },
        tx: { primary: '#f0f0fa', secondary: '#8888aa', muted: '#55556a' },
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        'glow': '0 0 24px rgba(124,92,252,0.25)',
        'glow-lg': '0 0 48px rgba(124,92,252,0.3)',
        'card': '0 24px 48px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
