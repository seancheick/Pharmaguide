// src/tests/e2e/jest.config.js
// Jest configuration for E2E tests

module.exports = {
  rootDir: '../../../',
  testMatch: ['<rootDir>/src/tests/e2e/**/*.e2e.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: '<rootDir>/src/tests/e2e/setup/globalSetup.js',
  globalTeardown: '<rootDir>/src/tests/e2e/setup/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/src/tests/e2e/setup/init.js'],
  testEnvironment: 'node',
  verbose: true,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './artifacts/junit',
        outputName: 'e2e-results.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ],
    [
      'jest-html-reporters',
      {
        publicPath: './artifacts/html',
        filename: 'e2e-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'PharmaGuide E2E Test Report'
      }
    ]
  ],
  collectCoverage: false, // E2E tests don't need code coverage
  bail: process.env.CI ? 1 : 0, // Fail fast in CI
  forceExit: true,
  detectOpenHandles: true
};
