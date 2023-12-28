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
        buttonBackground: '#9e0001',
        buttonBackgroundHover: '#ffffff',
        buttonDarkHover: '#7d0000',
      },
      keyframes: {
        octocatWave: {
          '0%, 100%': {
            transform: 'rotate(0)',
          },
          '20%, 60%': {
            transform: 'rotate(-25deg)',
          },
          '40%, 80%': {
            transform: 'rotate(10deg)',
          },
        },
      },
      animation: {
        octocatWave: 'octocatWave 560ms ease-in-out',
      },
    },
  },
  plugins: [],
};
