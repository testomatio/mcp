/** @type {import('jest').Config} */
export default {
  // Use ES modules
  preset: null,
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  // Test files
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  // Environment variables for tests
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Ignore patterns for integration tests when running unit tests
  testPathIgnorePatterns: [
    '<rootDir>/tests/integration/'
  ],
  // Collect coverage from source files only
  collectCoverageFrom: [
    'index.js',
    '!tests/**',
    '!jest.config.js',
    '!jest.setup.js'
  ],
  // Coverage directory
  coverageDirectory: 'coverage',
  // Coverage report formats
  coverageReporters: ['text', 'lcov', 'html']
};