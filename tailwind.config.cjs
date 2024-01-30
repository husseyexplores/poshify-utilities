/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--p-color-bg-surface)',
        'surface-hovered': 'var(--p-color-bg-surface-hover)',
        'surface-subdued': 'var(--p-color-bg-surface-disabled)',
      },
      fontFamily: {
        mono: ['var(--p-font-family-mono)'],
      },
      borderRadius: {
        'p200': 'var(--p-border-radius-200)'
      },
      borderColor: {
        'brand': 'var(--p-color-border-brand)',
      },
      typography: theme => ({
        DEFAULT: {
          css: {
            '--tw-prose-pre-bg': 'transparent',
            '--tw-prose-pre-code': theme('colors.slate.700'),
            // color: '#333',
            code: {
              color: theme('colors.slate.700'),
              '&:hover': {
                backgroundColor: theme('colors.slate.50'),
              },
            },
          },
        },
      }),
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [
    // Add colors as CSS variables.
    // Example :`var(--color-teal-500)`
    function ({ addBase, theme }) {
      function extractColorVars(colorObj, colorGroup = '') {
        return Object.keys(colorObj).reduce((vars, colorKey) => {
          const value = colorObj[colorKey]

          const newVars =
            typeof value === 'string'
              ? { [`--color${colorGroup}-${colorKey}`]: value }
              : extractColorVars(value, `-${colorKey}`)

          return { ...vars, ...newVars }
        }, {})
      }

      addBase({
        ':root': extractColorVars(theme('colors')),
      })
    },
    require('@tailwindcss/typography'),
  ],
}
