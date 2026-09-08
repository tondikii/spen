// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Code standard Spen: satu file ≤ 600 baris efektif, satu fungsi
      // ≤ 400 baris efektif (i18n.ts mendapat override sampai K7
      // memecahnya per namespace).
      'max-lines': ['error', { max: 600, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/i18n.ts', 'src/i18n/**'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off' },
  },
  {
    files: ['src/**/__tests__/**'],
    rules: { 'max-lines': 'off', 'max-lines-per-function': 'off' },
  },
];
