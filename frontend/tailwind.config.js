/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#613380',
        'primary-container': '#7a4b9a',
        'on-primary': '#ffffff',
        'on-primary-container': '#efcfff',
        secondary: '#3c6184',
        surface: '#f7f9ff',
        'on-surface': '#171c21',
        'on-surface-variant': '#4c444f',
        background: '#f7f9ff',
        outline: '#7d7480',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        'headline': ['Space Grotesk', 'sans-serif'],
        'body': ['Manrope', 'sans-serif'],
        'sans': ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
