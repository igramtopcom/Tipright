/** @type {import('tailwindcss').Config} */
// Mirrors the inline `tailwind.config` the Play CDN used to read on every page.
module.exports = {
  content: ['./dist/**/*.html', './src/**/*.js'],
  theme: {
    extend: {
      colors: {
        line: '#848B93',
        brand: {
          DEFAULT: '#1D9E75',
          dark:    '#0F6E56',
          darker:  '#0A5543',
          light:   '#E1F5EE',
          pale:    '#F0FAF6',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
