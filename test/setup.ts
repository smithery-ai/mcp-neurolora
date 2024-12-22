import { jest } from '@jest/globals';

// Make jest available globally
(global as any).jest = jest;

// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.MCP_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Setup test timeouts
jest.setTimeout(30000);

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
