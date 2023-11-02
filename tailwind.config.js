/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#9e0001',
        primaryDark: '#7d0000',
        warningColor: '#ffc101',
        successColor: '#3f784c',
        errorColor: '#7d1128',
        textColor: '#151515',
        whiteColor: '#ffffff',
        blackColor: '#000000',
      },
    },
  },
  plugins: [],
};
