import { jest } from '@jest/globals';
import type { Mock } from 'jest-mock';

type MockFunction<T> = jest.Mock<ReturnType<T>, Parameters<T>>;

interface OpenAICreate {
  (): Promise<{ choices: { message: { content: string } }[] }>;
}

interface GitHubIssueCreate {
  (): Promise<{ data: { number: number; html_url: string } }>;
}

interface GitHubIssueList {
  (): Promise<{ data: any[] }>;
}

interface GitHubRepoGet {
  (): Promise<{ data: { default_branch: string; owner?: { login: string }; name?: string } }>;
}

interface MockOpenAI {
  chat: {
    completions: {
      create: MockFunction<OpenAICreate>;
    };
  };
}

interface MockGitHub {
  rest: {
    issues: {
      create: MockFunction<GitHubIssueCreate>;
      list: MockFunction<GitHubIssueList>;
    };
    repos: {
      get: MockFunction<GitHubRepoGet>;
    };
  };
}

interface FsReadFile {
  (path: string): Promise<string>;
}

interface FsWriteFile {
  (path: string, data: string): Promise<void>;
}

interface FsMkdir {
  (path: string): Promise<void>;
}

interface FsReaddir {
  (path: string): Promise<string[]>;
}

interface FsStat {
  (path: string): Promise<{ isFile: () => boolean; isDirectory: () => boolean; size?: number }>;
}

interface FsAccess {
  (path: string): Promise<void>;
}

interface FsRm {
  (path: string): Promise<void>;
}

interface MockFsPromises {
  readFile: MockFunction<FsReadFile>;
  writeFile: MockFunction<FsWriteFile>;
  mkdir: MockFunction<FsMkdir>;
  readdir: MockFunction<FsReaddir>;
  stat: MockFunction<FsStat>;
  access: MockFunction<FsAccess>;
  rm: MockFunction<FsRm>;
}

interface MockFs {
  promises: MockFsPromises;
}

interface ProgressStart {
  (): void;
}

interface ProgressUpdate {
  (progress: number): void;
}

interface ProgressComplete {
  (): void;
}

interface ProgressFail {
  (message?: string): void;
}

interface MockProgressTracker {
  start: MockFunction<ProgressStart>;
  update: MockFunction<ProgressUpdate>;
  complete: MockFunction<ProgressComplete>;
  fail: MockFunction<ProgressFail>;
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
      create: jest.fn().mockResolvedValue({
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
      create: jest.fn<Promise<{ data: { number: number; html_url: string } }>, []>().mockResolvedValue({
        data: {
          number: 1,
          html_url: 'https://github.com/test/test/issues/1',
        },
      }),
      list: jest.fn<Promise<{ data: any[] }>, []>().mockResolvedValue({
        data: [],
      }),
    },
    repos: {
      get: jest.fn<Promise<{ data: { default_branch: string } }>, []>().mockResolvedValue({
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
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    access: jest.fn(),
    rm: jest.fn(),
  },
};

/**
 * Mock MCP Server
 */
export const mockMcpServer = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  setRequestHandler: jest.fn(),
  sendRequest: jest.fn(),
  onRequest: jest.fn(),
  onerror: jest.fn(),
};

/**
 * Mock Logger
 */
export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

/**
 * Mock Progress Tracker
 */
export const mockProgressTracker: MockProgressTracker = {
  start: jest.fn(),
  update: jest.fn(),
  complete: jest.fn(),
  fail: jest.fn(),
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
