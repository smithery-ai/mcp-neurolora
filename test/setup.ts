import { jest } from '@jest/globals';

// Make jest available globally
(global as any).jest = jest;

// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.MCP_ENV = 'test';

// Check required environment variables
const requiredEnvVars = {
  OPENAI_API_KEY: 'OpenAI API key is required for tests. Set OPENAI_API_KEY or mock the OpenAI API.',
  MCP_CONFIG_PATH: 'MCP config path is required for tests. Set MCP_CONFIG_PATH or provide a test config.',
};

// Only check env vars if we're not in CI environment (allow CI to handle its own env vars)
if (process.env.CI !== 'true') {
  Object.entries(requiredEnvVars).forEach(([key, message]) => {
    if (!process.env[key]) {
      console.error(`Error: ${message}`);
      console.error('To skip this check in CI, set CI=true');
      process.exit(1);
    }
  });
}

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
