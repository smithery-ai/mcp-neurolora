import { jest } from '@jest/globals';

// Define function types
type OpenAIResponse = {
  choices: Array<{ message: { content: string } }>;
};

type GitHubIssueResponse = {
  data: { number: number; html_url: string };
};

type GitHubListResponse = {
  data: any[];
};

type GitHubRepoResponse = {
  data: { default_branch: string; owner?: { login: string }; name?: string };
};

export interface MockOpenAI {
  chat: {
    completions: {
      create: jest.MockedFunction<() => Promise<OpenAIResponse>>;
    };
  };
}

export interface MockGitHub {
  rest: {
    issues: {
      create: jest.MockedFunction<() => Promise<GitHubIssueResponse>>;
      list: jest.MockedFunction<() => Promise<GitHubListResponse>>;
    };
    repos: {
      get: jest.MockedFunction<() => Promise<GitHubRepoResponse>>;
    };
  };
}

// Mock file system interfaces

type FsReadFileFn = (path: string, encoding?: string) => Promise<string>;
type FsWriteFileFn = (path: string, data: string) => Promise<void>;
type FsMkdirFn = (path: string) => Promise<void>;
type FsReaddirFn = (path: string) => Promise<string[]>;
type FsStatFn = (path: string) => Promise<{ isFile: () => boolean; isDirectory: () => boolean; size?: number }>;
type FsAccessFn = (path: string) => Promise<void>;
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

export interface MockFs {
  promises: {
    readFile: jest.MockedFunction<FsReadFileFn>;
    writeFile: jest.MockedFunction<FsWriteFileFn>;
    mkdir: jest.MockedFunction<FsMkdirFn>;
    readdir: jest.MockedFunction<FsReaddirFn>;
    stat: jest.MockedFunction<FsStatFn>;
    access: jest.MockedFunction<FsAccessFn>;
    rm: jest.MockedFunction<FsRmFn>;
  };
}

export interface MockProgressTracker {
  start: jest.MockedFunction<() => void>;
  update: jest.MockedFunction<(progress: number) => void>;
  complete: jest.MockedFunction<() => void>;
  fail: jest.MockedFunction<(message?: string) => void>;
}

/**
 * Mock implementations for external services and dependencies
 */

/**
 * Mock OpenAI API
 */
export const mockOpenAI: MockOpenAI = {
  chat: {
    completions: {
      create: jest.fn<() => Promise<{
        choices: Array<{ message: { content: string } }>;
      }>>().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Mock OpenAI response',
            },
          },
        ],
      }),
    },
  },
};

/**
 * Mock GitHub API
 */
export const mockGitHub: MockGitHub = {
  rest: {
    issues: {
      create: jest.fn<() => Promise<{
        data: { number: number; html_url: string };
      }>>().mockResolvedValue({
        data: {
          number: 1,
          html_url: 'https://github.com/test/test/issues/1',
        },
      }),
      list: jest.fn<() => Promise<{
        data: any[];
      }>>().mockResolvedValue({
        data: [],
      }),
    },
    repos: {
      get: jest.fn<() => Promise<{
        data: { default_branch: string; owner?: { login: string }; name?: string };
      }>>().mockResolvedValue({
        data: {
          default_branch: 'main',
        },
      }),
    },
  },
};

/**
 * Mock File System
 */
export const mockFs: MockFs = {
  promises: {
    readFile: jest.fn<FsReadFileFn>().mockResolvedValue(''),
    writeFile: jest.fn<FsWriteFileFn>().mockResolvedValue(),
    mkdir: jest.fn<FsMkdirFn>().mockResolvedValue(),
    readdir: jest.fn<FsReaddirFn>().mockResolvedValue([]),
    stat: jest.fn<FsStatFn>().mockResolvedValue({
      isFile: () => true,
      isDirectory: () => false,
      size: 1024
    }),
    access: jest.fn<FsAccessFn>().mockResolvedValue(),
    rm: jest.fn<FsRmFn>().mockResolvedValue(),
  },
};

/**
 * Mock MCP Server
 */
export interface MockMcpServer {
  connect: jest.MockedFunction<() => Promise<void>>;
  disconnect: jest.MockedFunction<() => Promise<void>>;
  setRequestHandler: jest.MockedFunction<(handler: (req: unknown) => Promise<unknown>) => void>;
  sendRequest: jest.MockedFunction<(req: unknown) => Promise<unknown>>;
  onRequest: jest.MockedFunction<(handler: (req: unknown) => Promise<unknown>) => void>;
  onerror: jest.MockedFunction<(error: Error) => void>;
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
export interface MockLogger {
  info: jest.MockedFunction<(message: string, ...args: any[]) => void>;
  error: jest.MockedFunction<(message: string, ...args: any[]) => void>;
  warn: jest.MockedFunction<(message: string, ...args: any[]) => void>;
  debug: jest.MockedFunction<(message: string, ...args: any[]) => void>;
}

export const mockLogger: MockLogger = {
  info: jest.fn<(message: string, ...args: any[]) => void>(),
  error: jest.fn<(message: string, ...args: any[]) => void>(),
  warn: jest.fn<(message: string, ...args: any[]) => void>(),
  debug: jest.fn<(message: string, ...args: any[]) => void>(),
};

/**
 * Mock Progress Tracker
 */
export const mockProgressTracker: MockProgressTracker = {
  start: jest.fn<() => void>(),
  update: jest.fn<(progress: number) => void>(),
  complete: jest.fn<() => void>(),
  fail: jest.fn<(message?: string) => void>(),
};

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
export function createMockError(code: string, message: string) {
  const error = new Error(message);
  error.name = code;
  return error;
}

/**
 * Mock API response
 */
export function mockApiResponse(status: number, data: any) {
  return {
    status,
    data,
    headers: {},
    config: {},
    statusText: status === 200 ? 'OK' : 'Error',
  };
}
