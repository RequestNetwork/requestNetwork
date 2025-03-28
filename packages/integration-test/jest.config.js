// The error ReferenceError: crypto is not defined occurs because the Node.js environment needs the crypto module to be explicitly available.
// For Node.js versions before 19, you need to add the crypto global explicitly.
const { webcrypto } = require('crypto');
global.crypto = webcrypto;

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
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
