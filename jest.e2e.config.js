/** @type {import('jest').Config} */
export default {
  preset: null,
  testEnvironment: 'node',
  transform: {},
  testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  testTimeout: 60000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};
