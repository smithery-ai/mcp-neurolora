/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(@modelcontextprotocol|chalk)/)'
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json'
      }
    ],
    '^.+\\.jsx?$': ['babel-jest', { configFile: './babel.config.cjs' }],
    '^.+\\.m?js$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)\\.mjs$': '$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^openai$': '<rootDir>/test/__mocks__/openai.ts'
  },
  moduleDirectories: ['node_modules', 'src'],
  testMatch: [
    '<rootDir>/test/**/*.test.ts',
    '<rootDir>/test/**/*.test.js',
    '<rootDir>/test/**/*.spec.ts',
    '<rootDir>/test/**/*.spec.js'
  ],
  testTimeout: 30000,
  verbose: true,
  silent: false,
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Test Report',
        outputPath: './test-report/index.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        includeConsoleLog: true,
        useCssFile: true
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './test-report',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ],
    ['jest-summary-reporter', {}]
  ],
  collectCoverage: true,
  coverageDirectory: './test-report/coverage',
  coverageReporters: ['text-summary', 'html', 'lcov'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 50,
      functions: 50,
      lines: 50
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/',
    '/test-report/',
    '/test/__mocks__/'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/__mocks__/'
  ],
  maxWorkers: '50%'
};
