import { jest } from '@jest/globals';
import type { OpenAIClient, OpenAICreateFn } from '../types/openai.js';
import type { 
  GitHubClient, 
  GitHubIssueResponse, 
  GitHubListResponse, 
  GitHubRepoResponse,
  GitHubIssueCreateFn,
  GitHubIssueListFn,
  GitHubRepoGetFn
} from '../types/github.js';

type JestMockFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>;

// Import all types from separate type definition files

export interface MockOpenAI {
  chat: {
    completions: {
      create: JestMockFunction<OpenAICreateFn>;
    };
  };
}

export interface MockGitHub {
  rest: {
    issues: {
      create: JestMockFunction<GitHubIssueCreateFn>;
      list: JestMockFunction<GitHubIssueListFn>;
    };
    repos: {
      get: JestMockFunction<GitHubRepoGetFn>;
    };
  };
}

// Mock file system interfaces

type FsReadFileFn = (path: string, encoding?: string) => Promise<string>;
type FsWriteFileFn = (path: string, data: string) => Promise<void>;
type FsMkdirFn = (path: string) => Promise<void>;
type FsReaddirFn = (path: string) => Promise<string[]>;
type FsStatFn = (path: string) => Promise<{ 
  isFile: () => boolean; 
  isDirectory: () => boolean; 
  isSymbolicLink: () => boolean;
  size: number;
}>;type FsAccessFn = (path: string) => Promise<void>;
type FsRmFn = (path: string) => Promise<void>;

interface MockFsPromises {
  readFile: jest.Mock<FsReadFileFn>;
  writeFile: jest.Mock<FsWriteFileFn>;
  mkdir: jest.Mock<FsMkdirFn>;
  readdir: jest.Mock<FsReaddirFn>;
  stat: jest.Mock<FsStatFn>;
  access: jest.Mock<FsAccessFn>;
  rm: jest.Mock<FsRmFn>;
}

export interface FsPromises {
  readFile: FsReadFileFn;
  writeFile: FsWriteFileFn;
  mkdir: FsMkdirFn;
  readdir: FsReaddirFn;
  stat: FsStatFn;
  access: FsAccessFn;
  rm: FsRmFn;
}

export interface MockFs {
  promises: jest.Mocked<FsPromises>;
}

export interface ProgressTracker {
  start: () => void;
  update: (progress: number) => void;
  complete: () => void;
  fail: (message?: string) => void;
}

export type MockProgressTracker = jest.Mocked<ProgressTracker>;

/**
 * Mock implementations for external services and dependencies
 */

/**
 * Mock OpenAI API
 */
export const mockOpenAI: jest.Mocked<OpenAIClient> = {
  chat: {
    completions: {
      create: jest.fn().mockImplementation(async () => ({
        choices: [
          {
            message: {
              content: 'Mock OpenAI response',
              role: 'assistant',
            },
            index: 0,
            finish_reason: 'stop',
          },
        ],
        created: Date.now(),
        model: 'gpt-3.5-turbo',
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      })),
    },
  },
} as jest.Mocked<OpenAIClient>;

/**
 * Mock GitHub API
 */
export const mockGitHub: jest.Mocked<GitHubClient> = {
  rest: {
    issues: {
      create: jest.fn<GitHubIssueCreateFn>().mockImplementation(async () => ({
        data: {
          number: 1,
          html_url: 'https://github.com/test/test/issues/1',
        },
      })),
      list: jest.fn<GitHubIssueListFn>().mockImplementation(async () => ({
        data: [],
      })),
    },
    repos: {
      get: jest.fn<GitHubRepoGetFn>().mockImplementation(async () => ({
        data: {
          default_branch: 'main',
          owner: { login: 'test' },
          name: 'test-repo',
        },
      })),
    },
  },
};

/**
 * Mock File System
 */
export const mockFs: MockFs = {
  promises: {
    readFile: jest.fn<FsReadFileFn>().mockImplementation(async () => 'mock content'),
    writeFile: jest.fn<FsWriteFileFn>().mockImplementation(async () => undefined),
    mkdir: jest.fn<FsMkdirFn>().mockImplementation(async () => undefined),
    readdir: jest.fn<FsReaddirFn>().mockImplementation(async () => ['file1.txt']),
    stat: jest.fn<FsStatFn>().mockImplementation(async () => ({
      isFile: () => true,
      isDirectory: () => false,
      isSymbolicLink: () => false,
      size: 1024
    })),
    access: jest.fn<FsAccessFn>().mockImplementation(async () => undefined),
    rm: jest.fn<FsRmFn>().mockImplementation(async () => undefined),
  } as jest.Mocked<FsPromises>,
};

/**
 * Mock MCP Server
 */
export interface MockMcpServer {
  connect: JestMockFunction<() => Promise<void>>;
  disconnect: JestMockFunction<() => Promise<void>>;
  setRequestHandler: JestMockFunction<(handler: (req: unknown) => Promise<unknown>) => void>;
  sendRequest: JestMockFunction<(req: unknown) => Promise<unknown>>;
  onRequest: JestMockFunction<(handler: (req: unknown) => Promise<unknown>) => void>;
  onerror: JestMockFunction<(error: Error) => void>;
}

export const mockMcpServer: MockMcpServer = {
  connect: jest.fn<() => Promise<void>>().mockResolvedValue(),
  disconnect: jest.fn<() => Promise<void>>().mockResolvedValue(),
  setRequestHandler: jest.fn<(handler: (req: unknown) => Promise<unknown>) => void>(),
  sendRequest: jest.fn<(req: unknown) => Promise<unknown>>().mockResolvedValue({}),
  onRequest: jest.fn<(handler: (req: unknown) => Promise<unknown>) => void>(),
  onerror: jest.fn<(error: Error) => void>(),
};

/**
 * Mock Logger
 */
export interface Logger {
  info: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

export type MockLogger = jest.Mocked<Logger>;

export const mockLogger: MockLogger = {
  info: jest.fn<(...args: [string, ...any[]]) => void>().mockImplementation(() => {}),
  error: jest.fn<(...args: [string, ...any[]]) => void>().mockImplementation(() => {}),
  warn: jest.fn<(...args: [string, ...any[]]) => void>().mockImplementation(() => {}),
  debug: jest.fn<(...args: [string, ...any[]]) => void>().mockImplementation(() => {}),
} as jest.Mocked<Logger>;

/**
 * Mock Progress Tracker
 */
export const mockProgressTracker: MockProgressTracker = {
  start: jest.fn<() => void>().mockImplementation(() => {}),
  update: jest.fn<(progress: number) => void>().mockImplementation(() => {}),
  complete: jest.fn<() => void>().mockImplementation(() => {}),
  fail: jest.fn<(message?: string) => void>().mockImplementation(() => {}),
} as jest.Mocked<ProgressTracker>;

/**
 * Mock Session Manager
 */
export const mockSessionManager = {
  createSession: jest.fn(),
  getSession: jest.fn(),
  removeSession: jest.fn(),
  clearSessions: jest.fn(),
};

/**
 * Reset all mocks between tests
 */
export function resetMocks() {
  jest.clearAllMocks();

  // Reset OpenAI mock
  mockOpenAI.chat.completions.create.mockReset();
  mockOpenAI.chat.completions.create.mockResolvedValue({
    choices: [
      {
        message: {
          content: 'Mock OpenAI response',
        },
      },
    ],
  });

  // Reset GitHub mock
  mockGitHub.rest.issues.create.mockReset();
  mockGitHub.rest.issues.create.mockResolvedValue({
    data: {
      number: 1,
      html_url: 'https://github.com/test/test/issues/1',
    },
  });

  // Reset File System mock
  Object.values(mockFs.promises).forEach(mock => mock.mockReset());

  // Reset MCP Server mock
  Object.values(mockMcpServer).forEach(mock => mock.mockReset());

  // Reset Logger mock
  Object.values(mockLogger).forEach(mock => mock.mockReset());

  // Reset Progress Tracker mock
  Object.values(mockProgressTracker).forEach(mock => mock.mockReset());

  // Reset Session Manager mock
  Object.values(mockSessionManager).forEach(mock => mock.mockReset());
}

/**
 * Setup default mock implementations
 */
export function setupDefaultMocks() {
  // Setup File System mocks
  mockFs.promises.stat.mockResolvedValue({
    isFile: () => true,
    isDirectory: () => false,
    isSymbolicLink: () => false,
    size: 1024,
  });

  mockFs.promises.readdir.mockResolvedValue(['file1.txt', 'file2.txt']);

  mockFs.promises.readFile.mockResolvedValue('Mock file content');

  // Setup GitHub mocks
  mockGitHub.rest.repos.get.mockResolvedValue({
    data: {
      default_branch: 'main',
      owner: { login: 'test' },
      name: 'test-repo',
    },
  });

  // Setup Session Manager mocks
  mockSessionManager.getSession.mockReturnValue({
    id: 'test-session',
    data: {},
  });
}

/**
 * Create mock error
 */
/**
 * Mock API response types
 */
interface ApiResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
  config: Record<string, any>;
  statusText: string;
}

export function mockApiResponse<T>(status: number, data: T): ApiResponse<T> {
  return {
    status,
    data,
    headers: {},
    config: {},
    statusText: status === 200 ? 'OK' : 'Error',
  };
}

/**
 * Mock error with code
 */
export function createMockError(code: string, message: string): Error & { code: string } {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  error.name = code;
  return error;
}
