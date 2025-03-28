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
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(graphql-request|@superfluid-finance/sdk-core)/)'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
