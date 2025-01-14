/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg_primary': '#d9edf7',
        'btn_primary': '#668BAE',
        'btn_secondary': '#02C39A',
        'btn_tertiary': '#EB4335',
        'btn_quaternary': '#FB8005',
        'text_primary': '#808080',
        'text_secondary': '#000000',
      }
    },
  },
  plugins: [],
}
