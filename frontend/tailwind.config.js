/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C5CE7',
          light: '#a78bfa',
          dark: '#4f46e5',
          pale: '#ede9fe',
        },
        ink: '#1a1a2e',
        surface: '#f8f7ff',
        match: {
          high: '#00b894',
          mid: '#f59e0b',
          low: '#ef4444',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '10px',
        badge: '20px',
      },
    },
  },
  plugins: [],
};
