import { jest } from '@jest/globals';
import path from 'path';
import fs from 'fs/promises';

// Mock MCP SDK modules
// Simple mock implementations
const mockConnect = jest.fn().mockImplementation(() => Promise.resolve());

const mockServer = {
  connect: mockConnect
};

const mockTransport = {};

// Create module mocks
const mockServerModule = {
  Server: jest.fn().mockImplementation(() => mockServer),
  __esModule: true
};

const mockTransportModule = {
  StdioServerTransport: jest.fn().mockImplementation(() => mockTransport),
  __esModule: true
};

// Apply mocks
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => mockServerModule);
jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => mockTransportModule);

// Export mocked constructors
const { Server } = mockServerModule;
const { StdioServerTransport } = mockTransportModule;

/**
 * Test utilities for MCP Neurolora
 */

/**
 * Creates a test server instance
 */
export async function createTestServer() {
  const server = new Server({
    name: 'test-server',
    version: '1.0.0',
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  return server;
}

/**
 * Creates a temporary test directory
 */
export async function createTempTestDir() {
  const testDir = path.join(process.cwd(), 'test-temp');
  await fs.mkdir(testDir, { recursive: true });
  return testDir;
}

/**
 * Cleans up temporary test directory
 */
export async function cleanupTempTestDir() {
  const testDir = path.join(process.cwd(), 'test-temp');
  await fs.rm(testDir, { recursive: true, force: true });
}

/**
 * Creates test files with specified content
 */
export async function createTestFiles(dir: string, files: Record<string, string>) {
  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(dir, filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  }
}

/**
 * Mocks MCP configuration
 */
export function mockMcpConfig(config: Record<string, any> = {}) {
  return {
    mcpServers: {
      'test-server': {
        command: 'node',
        args: ['test-server.js'],
        env: {},
        ...config,
      },
    },
  };
}

/**
 * Helper to wait for async operations
 */
export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Memory usage tracker
 */
export function trackMemoryUsage(label: string) {
  const used = process.memoryUsage();
  console.log(`\nMemory usage ${label}:`);
  for (const [key, value] of Object.entries(used)) {
    console.log(`${key}: ${Math.round((value / 1024 / 1024) * 100) / 100} MB`);
  }
}

/**
 * Test environment setup helper
 */
export async function setupTestEnvironment() {
  // Setup test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MCP_ENV = 'test';

  // Create temp directory
  await createTempTestDir();
}

/**
 * Test environment cleanup helper
 */
export async function cleanupTestEnvironment() {
  // Cleanup temp files
  await cleanupTempTestDir();

  // Reset environment variables
  delete process.env.NODE_ENV;
  delete process.env.MCP_ENV;
}

/**
 * Test request helper
 */
export function createTestRequest(params: Record<string, any> = {}) {
  return {
    jsonrpc: '2.0',
    method: 'test',
    params,
    id: 1,
  };
}

/**
 * Test response validator
 */
export function validateTestResponse(response: any) {
  expect(response).toHaveProperty('jsonrpc', '2.0');
  expect(response).toHaveProperty('id');
  if (response.error) {
    expect(response.error).toHaveProperty('code');
    expect(response.error).toHaveProperty('message');
  } else {
    expect(response).toHaveProperty('result');
  }
}

/**
 * Test data generator
 */
export function generateTestData() {
  return {
    sampleCode: `
      function test() {
        console.log('test');
      }
    `,
    sampleConfig: {
      key: 'value',
      number: 123,
      enabled: true,
    },
    sampleError: new Error('Test error'),
  };
}

/**
 * Test context manager
 */
export class TestContext {
  private tempFiles: string[] = [];
  private cleanupFns: (() => Promise<void>)[] = [];

  async setup() {
    await setupTestEnvironment();
  }

  async cleanup() {
    // Run cleanup functions in reverse order
    for (const fn of this.cleanupFns.reverse()) {
      await fn();
    }
    await cleanupTestEnvironment();
  }

  addCleanup(fn: () => Promise<void>) {
    this.cleanupFns.push(fn);
  }

  async createTempFile(content: string) {
    const filename = `test-${Date.now()}.txt`;
    const filepath = path.join(await createTempTestDir(), filename);
    await fs.writeFile(filepath, content);
    this.tempFiles.push(filepath);
    return filepath;
  }
}
