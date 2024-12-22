/**
 * Common test fixtures and data
 */

export const testFiles = {
  typescript: {
    'file1.ts': `
      function test() {
        console.log('test');
      }
    `,
    'file2.ts': `
      interface TestInterface {
        prop: string;
      }
    `,
  },
  javascript: {
    'file1.js': `
      module.exports = {
        test: () => console.log('test')
      };
    `,
  },
  markdown: {
    'README.md': `# Test
      This is a test file
    `,
  },
  json: {
    'config.json': `{
      "test": true,
      "value": 123
    }`,
  },
};

export const testErrors = {
  fileSystem: {
    notFound: new Error('ENOENT: no such file or directory'),
    permission: new Error('EACCES: permission denied'),
    exists: new Error('EEXIST: file already exists'),
  },
  validation: {
    invalidPath: new Error('Invalid path'),
    pathNotAllowed: new Error('Path not allowed'),
    invalidInput: new Error('Invalid input'),
  },
  network: {
    timeout: new Error('Network timeout'),
    connection: new Error('Connection failed'),
  },
};

export const testConfigs = {
  mcp: {
    basic: {
      mcpServers: {
        'test-server': {
          command: 'node',
          args: ['test-server.js'],
          env: {
            NODE_ENV: 'test',
          },
        },
      },
    },
    withOptions: {
      mcpServers: {
        'test-server': {
          command: 'node',
          args: ['test-server.js'],
          env: {
            NODE_ENV: 'test',
            DEBUG: 'true',
            TEST_MODE: 'true',
          },
        },
      },
    },
  },
  tools: {
    codeCollector: {
      input: '/test/input',
      outputPath: '/test/output',
      ignorePatterns: ['node_modules', '.git'],
    },
    codeAnalyzer: {
      input: '/test/input/code.ts',
      outputPath: '/test/output',
    },
  },
};

export const testResponses = {
  success: {
    codeCollector: {
      status: 'success',
      filesCount: 2,
      outputPath: '/test/output/FULL_CODE.md',
      message: 'Successfully collected 2 files',
    },
    codeAnalyzer: {
      status: 'success',
      type: 'analyze',
      issues: [],
      message: 'Analysis completed successfully',
    },
  },
  error: {
    codeCollector: {
      status: 'error',
      error: 'file_not_found',
      message: 'File not found',
      details: {
        path: '/test/input/missing.ts',
      },
    },
    codeAnalyzer: {
      status: 'error',
      error: 'analysis_failed',
      message: 'Analysis failed',
      details: {
        reason: 'Invalid syntax',
      },
    },
  },
};

export const testPaths = {
  valid: {
    absolute: '/test/path/to/file.ts',
    relative: './src/utils/test.ts',
    normalized: '/test/path/normalized',
  },
  invalid: {
    outside: '../../../etc/passwd',
    malformed: '/test/path/../../etc/passwd',
    notAllowed: '/etc/passwd',
  },
};

export const testProgress = {
  operations: [
    {
      name: 'Test Operation',
      totalSteps: 100,
      currentStep: 50,
      status: 'in_progress',
    },
    {
      name: 'Failed Operation',
      totalSteps: 100,
      currentStep: 25,
      status: 'failed',
      error: new Error('Operation failed'),
    },
    {
      name: 'Completed Operation',
      totalSteps: 100,
      currentStep: 100,
      status: 'completed',
    },
  ],
};

export const testEnvironments = {
  development: {
    NODE_ENV: 'development',
    DEBUG: 'true',
    LOG_LEVEL: 'debug',
  },
  test: {
    NODE_ENV: 'test',
    DEBUG: 'true',
    LOG_LEVEL: 'error',
  },
  production: {
    NODE_ENV: 'production',
    DEBUG: 'false',
    LOG_LEVEL: 'info',
  },
};
