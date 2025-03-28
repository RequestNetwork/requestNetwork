const jestCommonConfig = require('../../jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...jestCommonConfig,
  transformIgnorePatterns: [
    '/node_modules/(?!(graphql-request|@graphql-typed-document-node|cross-fetch|extract-files|form-data)/)',
  ],
};
