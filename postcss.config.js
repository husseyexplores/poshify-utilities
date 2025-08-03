const prefixwrap = require('postcss-prefixwrap')

const DEV = process.env.NODE_ENV !== 'production'
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    DEV
      ? null
      : prefixwrap('.PoshifyUtils_Root', {
          ignoredSelectors: ['.PoshifyUtils_Root', '.PoshifyUtils_ToggleBtn'],
        }),
  ].filter(Boolean),
  // plugins: {
  //   tailwindcss: {},
  //   autoprefixer: {},
  // },
}
