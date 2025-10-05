import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config();

// Mock console.error to avoid cluttering test output
global.console = {
  ...console,
  error: jest.fn(),
  log: jest.fn()
};