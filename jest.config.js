module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    updateSnapshot: process.env.CI ? true : false,
  },

  reporters: [
    'default',
    [ 'jest-junit', {
      outputDirectory: 'test-report-directory',
      outputName: 'test-report.xml',
    }]
  ]
};
