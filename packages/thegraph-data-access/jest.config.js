const jestCommonConfig = require('../../jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...jestCommonConfig,
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
    'node_modules/graphql-request/.+\\.(j|t)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!graphql-request)/'],
};
