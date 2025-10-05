/** @type {import('jest').Config} */
export default {
  // Use ES modules
  preset: null,
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  // Test files for integration tests only
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.js'
  ],
  // Environment variables for tests
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Longer timeout for integration tests
  testTimeout: 30000,
  // Collect coverage from source files only
  collectCoverageFrom: [
    'index.js',
    '!tests/**',
    '!jest.config.js',
    '!jest.setup.js',
    '!jest.integration.config.js'
  ],
  // Coverage directory
  coverageDirectory: 'coverage/integration',
  // Coverage report formats
  coverageReporters: ['text', 'lcov', 'html'],
  // Verbose output for integration tests
  verbose: true,
  // Ensure console output is visible
  silent: false,
  // Force exit after tests
  forceExit: true,
  // Custom reporter to ensure console output
  reporters: ['default']
};