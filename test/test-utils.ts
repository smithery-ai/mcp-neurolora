import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ErrorHandler, ConnectionManager } from '../src/server';
import { jest, beforeAll } from '@jest/globals';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  ConnectionManager.resetInstance();
});

interface MockTransport {
  send: jest.Mock;
  close: jest.Mock;
  start: jest.Mock;
  onmessage: jest.Mock;
  onerror: jest.Mock;
  onclose: jest.Mock;
}

/**
 * Create a test server instance for testing tools
 */
export function createTestServer() {
  const server = new Server({
    name: 'test-server',
    version: '1.0.0',
    capabilities: {
      tools: {},
    },
  });

  const config = {
    name: 'test-server',
    baseDir: process.cwd(),
  };

  const errorHandler = new ErrorHandler(config);
  const connectionManager = ConnectionManager.getInstance(server, errorHandler);

  // Initialize mock transport
  const mockTransport: MockTransport = {
    send: jest.fn().mockImplementation(() => Promise.resolve()),
    close: jest.fn().mockImplementation(() => Promise.resolve()),
    start: jest.fn().mockImplementation(() => Promise.resolve()),
    onmessage: jest.fn(),
    onerror: jest.fn(),
    onclose: jest.fn(),
  };

  // Initialize connection
  try {
    connectionManager.connect(mockTransport);
  } catch (error) {
    // Игнорируем ошибку если подключение уже установлено
    if (!(error instanceof Error && error.message === 'Connection already in progress')) {
      throw error;
    }
  }

  return {
    server,
    errorHandler,
    connectionManager,
  };
}

/**
 * Initialize tool handler with test server
 */
export function initializeToolHandler(handler: any) {
  if (!handler) {
    return null;
  }

  const { connectionManager } = createTestServer();
  if (handler.setConnectionManager) {
    handler.setConnectionManager(connectionManager);
  }
  return handler;
}

/**
 * Create test file content
 */
export function createTestFile(content: string = 'console.log("test");') {
  return content;
}
