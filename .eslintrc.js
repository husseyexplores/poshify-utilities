// 0 - off
// 1 - warn
// 2 - error

module.exports = {
  extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'jsx-a11y', 'import', 'prettier', 'html', 'react-hooks'],
  rules: {
    'react/prop-types': [1],
    semi: [0, 'never'],
    'linebreak-style': 1,
    'prettier/prettier': [
      1,
      {
        trailingComma: 'es5',
        singleQuote: true,
        printWidth: 80,
        semi: false,
        endOfLine: 'lf',
      },
    ],
    'no-console': 1,
    'no-unused-vars': [
      1,
      {
        ignoreSiblings: true,
        argsIgnorePattern: 'res|next|^err',
      },
    ],
    'prefer-const': [
      'warn',
      {
        destructuring: 'all',
      },
    ],
    'no-return-assign': [2, 'except-parens'],
    quotes: [
      1,
      'single',
      {
        avoidEscape: true,
        allowTemplateLiterals: true,
      },
    ],
    'react/jsx-filename-extension': [
      1,
      {
        extensions: ['.js', '.jsx'],
      },
    ],
    'no-param-reassign': [
      1,
      {
        props: false,
      },
    ],
    'jsx-a11y/href-no-hash': 0,
    'jsx-a11y/anchor-is-valid': [
      1,
      {
        aspects: ['invalidHref'],
      },
    ],
    'react-hooks/rules-of-hooks': 1,
    'react-hooks/exhaustive-deps': 1,
  },
  env: {
    es6: true,
    browser: true,
    webextensions: true
  },
}
