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
  ...(process.env.CI === 'true' ? { maxWorkers: '50%' } : {}),
};
