/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FF9900', // Amazon Orange
        'primary-dark': '#E88B00',
        secondary: '#232f3e', // Amazon Dark Blue
        'secondary-dark': '#131921',
        'bg-light': '#f5f5f5',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
