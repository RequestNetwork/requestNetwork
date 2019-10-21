module.exports = function(config) {
  config.set({
    mutate: ['src/**/*.ts'],
    mutator: 'typescript',
    packageManager: 'yarn',
    reporters: ['html', 'clear-text', 'progress', 'dashboard'],
    testRunner: 'mocha',
    testFramework: 'mocha',
    tsconfigFile: 'tsconfig.json',
    mochaOptions: {
      spec: ['test/**/*.ts'],
      require: ['ts-node/register'],
    },
  });
};
