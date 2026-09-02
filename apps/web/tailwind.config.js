/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f0',
          100: '#fbe4da',
          400: '#e3805a',
          500: '#c9542f',
          600: '#a63f21',
          700: '#7f2f18',
        },
      },
      maxWidth: {
        app: '480px',
      },
    },
  },
  plugins: [],
};
