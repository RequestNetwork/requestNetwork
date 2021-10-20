// eslint-disable-next-line no-undef
module.exports = {
  extends: '../../.eslintrc',
  ignorePatterns: ['/src/lib/artifacts/**/index.ts'],
  rules: {
    '@typescript-eslint/no-var-requires': ['warn'],
  },
};
