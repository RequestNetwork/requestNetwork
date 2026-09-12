const jestCommonConfig = require('../../jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...jestCommonConfig,
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          isolatedModules: process.env.ISOLATED_MODULES !== 'false',
        },
      },
    ],
  },
};
