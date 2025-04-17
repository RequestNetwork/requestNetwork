/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        addFileAttribute: 'true',
        ancestorSeparator: ' > ',
        suiteNameTemplate: '{filename}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        outputDirectory: 'reports',
        outputName: 'jest-results.xml',
      },
    ],
  ],
  maxWorkers: process.env.CI === '1' ? '50%' : undefined,
};
