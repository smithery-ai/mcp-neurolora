import { jest } from '@jest/globals';

// Define mock function types with parameters and return types
type OpenAICreateFn = () => Promise<{
  choices: Array<{ message: { content: string } }>;
}>;

type GitHubIssueFn = () => Promise<{
  data: { number: number; html_url: string };
}>;

type GitHubListFn = () => Promise<{
  data: any[];
}>;

type GitHubRepoFn = () => Promise<{
  data: { default_branch: string; owner?: { login: string }; name?: string };
}>;

type FsStatFn = () => Promise<{
  isFile: () => boolean;
  isDirectory: () => boolean;
  size?: number;
}>;

type FsReaddirFn = () => Promise<string[]>;
type FsReadFileFn = () => Promise<string>;
type FsWriteFileFn = () => Promise<void>;
type FsMkdirFn = () => Promise<void>;
type FsAccessFn = () => Promise<void>;
type FsRmFn = () => Promise<void>;

// Define function types
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
      create: jest.Mock;
    };
  };
}

interface MockGitHub {
  rest: {
    issues: {
      create: jest.Mock;
      list: jest.Mock;
    };
    repos: {
      get: jest.Mock;
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
  readFile: jest.Mock;
  writeFile: jest.Mock;
  mkdir: jest.Mock;
  readdir: jest.Mock;
  stat: jest.Mock;
  access: jest.Mock;
  rm: jest.Mock;
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
  start: jest.Mock;
  update: jest.Mock;
  complete: jest.Mock;
  fail: jest.Mock;
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
      create: jest.fn<OpenAICreateFn>().mockResolvedValue({
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
      create: jest.fn<GitHubIssueFn>().mockResolvedValue({
        data: {
          number: 1,
          html_url: 'https://github.com/test/test/issues/1',
        },
      }),
      list: jest.fn<GitHubListFn>().mockResolvedValue({
        data: [],
      }),
    },
    repos: {
      get: jest.fn<GitHubRepoFn>().mockResolvedValue({
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
    readFile: jest.fn<FsReadFileFn>(),
    writeFile: jest.fn<FsWriteFileFn>(),
    mkdir: jest.fn<FsMkdirFn>(),
    readdir: jest.fn<FsReaddirFn>(),
    stat: jest.fn<FsStatFn>(),
    access: jest.fn<FsAccessFn>(),
    rm: jest.fn<FsRmFn>(),
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
