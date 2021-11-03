module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  testPathIgnorePatterns: ['test/ipfs-manager.test.ts'],
};
