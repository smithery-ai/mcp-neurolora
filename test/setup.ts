import { jest } from '@jest/globals';

// Make jest available globally
(global as any).jest = jest;

// Import expect from jest package for proper initialization
import * as jestExpect from 'expect';
(global as any).expect = jestExpect;

// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.MCP_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.MCP_CONFIG_PATH = './test/__mocks__/mcp-config.json';
// Mock timers for all tests
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});
process.env.CI = 'true'; // Enable CI mode for tests

// Load mock config
import path from 'path';
import fs from 'fs/promises';

async function loadMockConfig() {
  const configPath = process.env.MCP_CONFIG_PATH || path.join(process.cwd(), 'test', '__mocks__', 'mcp-config.json');
  try {
    const mcpConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
    const mcpEnv = mcpConfig?.mcpServers?.['local-mcp-neurolora']?.env;
    if (mcpEnv) {
      Object.assign(process.env, mcpEnv);
    }
  } catch (error) {
    console.warn('Failed to load mock config:', error);
  }
}

// Load mock config before running tests
loadMockConfig();

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
