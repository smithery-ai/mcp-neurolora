import { jest, describe, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import { codeCollectorHandler } from '../../../src/tools/code-collector/handler.js';
import type { Mock } from 'jest-mock';
import chalk from 'chalk';

// Import mocks first
const { mockFs, mockProgressTracker, resetMocks, setupDefaultMocks } = await import('../../__mocks__/external-services.mock.js');
const { TestContext } = await import('../../helpers/test-utils.js');

type Context = {
  setup: () => Promise<void>;
  cleanup: () => Promise<void>;
};

// Setup mocks
jest.mock('fs/promises', () => ({
  ...mockFs.promises,
  __esModule: true
}));

jest.mock('../../../src/utils/progress-tracker.js', () => ({
  __esModule: true,
  ProgressTracker: jest.fn().mockImplementation(() => mockProgressTracker)
}));

describe('Code Collector Tool', () => {
  let context: Context;

  beforeAll(async () => {
    context = new TestContext() as Context;
    await context.setup();
  });

  afterAll(async () => {
    await context.cleanup();
  });

  beforeEach(() => {
    resetMocks();
    setupDefaultMocks();
  });

  describe('handleCollectCode', () => {
    it('should collect code from a directory', async () => {
      // Setup
      const inputDir = '/test/input';
      const outputDir = '/test/output';

      mockFs.promises.readdir.mockImplementationOnce(async () => ['file1.ts', 'file2.ts']);
      mockFs.promises.stat.mockImplementation(async (path: string) => ({
          isFile: () => path.endsWith('.ts'),
          isDirectory: () => !path.endsWith('.ts'),
        }));
      mockFs.promises.readFile.mockImplementation(async (path: string) => {
        if (path.endsWith('file1.ts')) {
          return Promise.resolve('const x = 1;');
        }
        if (path.endsWith('file2.ts')) {
          return Promise.resolve('function test() {}');
        }
        return Promise.resolve('');
      });

      // Execute
      const result = await codeCollectorHandler.handleCollectCode({
        input: inputDir,
        outputPath: outputDir,
      });

      // Verify
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(mockFs.promises.writeFile).toHaveBeenCalled();

      // Verify progress tracking
      expect(mockProgressTracker.start).toHaveBeenCalled();
      expect(mockProgressTracker.update).toHaveBeenCalled();
      expect(mockProgressTracker.complete).toHaveBeenCalled();
    });

    it('should handle empty directories', async () => {
      // Setup
      mockFs.promises.readdir.mockImplementationOnce(async () => []);

      // Execute
      const result = await codeCollectorHandler.handleCollectCode({
        input: '/empty/dir',
        outputPath: '/test/output',
      });

      // Verify
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(mockFs.promises.writeFile).toHaveBeenCalled();
      expect(mockProgressTracker.complete).toHaveBeenCalled();
    });

    it('should handle file reading errors', async () => {
      // Setup
      mockFs.promises.readdir.mockImplementationOnce(async () => ['error.ts']);
      mockFs.promises.readFile.mockRejectedValueOnce(new Error('Read error'));

      // Execute and verify
      await expect(
        codeCollectorHandler.handleCollectCode({
          input: '/test/input',
          outputPath: '/test/output',
        })
      ).rejects.toThrow('Read error');

      // Verify error handling
      expect(mockProgressTracker.fail).toHaveBeenCalled();
    });

    it('should respect ignore patterns', async () => {
      // Setup
      mockFs.promises.readdir.mockImplementationOnce(async () => ['file.ts', 'node_modules']);

      // Execute
      const result = await codeCollectorHandler.handleCollectCode({
        input: '/test/input',
        outputPath: '/test/output',
        ignorePatterns: ['node_modules'],
      });

      // Verify
      expect(result).toBeDefined();
      expect(mockFs.promises.readFile).toHaveBeenCalledTimes(1);
      expect(mockFs.promises.readFile).toHaveBeenCalledWith(
        expect.stringContaining('file.ts'),
        'utf8'
      );
    });

    it('should handle large directories recursively', async () => {
      // Setup
      mockFs.promises.readdir
        .mockImplementationOnce(async () => ['dir1', 'file1.ts'])
        .mockImplementationOnce(async () => ['file2.ts', 'file3.ts']);

      mockFs.promises.stat.mockImplementation((path: string) =>
        Promise.resolve({
          isFile: () => path.endsWith('.ts'),
          isDirectory: () => path.includes('dir1'),
        })
      );

      // Execute
      const result = await codeCollectorHandler.handleCollectCode({
        input: '/test/input',
        outputPath: '/test/output',
      });

      // Verify
      expect(result).toBeDefined();
      expect(mockFs.promises.readFile).toHaveBeenCalledTimes(3);
      expect(mockProgressTracker.update).toHaveBeenCalledTimes(3);
    });

    it('should handle symlinks safely', async () => {
      // Setup
      mockFs.promises.readdir.mockImplementationOnce(async () => ['link.ts']);
      mockFs.promises.stat.mockImplementation(() =>
        Promise.resolve({
          isFile: () => true,
          isDirectory: () => false,
          isSymbolicLink: () => true,
        })
      );

      // Execute
      const result = await codeCollectorHandler.handleCollectCode({
        input: '/test/input',
        outputPath: '/test/output',
      });

      // Verify
      expect(result).toBeDefined();
      expect(mockFs.promises.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle file size limits', async () => {
      // Setup
      mockFs.promises.readdir.mockImplementationOnce(async () => ['large.ts']);
      mockFs.promises.stat.mockResolvedValueOnce({
        isFile: () => true,
        isDirectory: () => false,
        size: 2 * 1024 * 1024, // 2MB
      });

      // Execute and verify
      await expect(
        codeCollectorHandler.handleCollectCode({
          input: '/test/input',
          outputPath: '/test/output',
        })
      ).rejects.toThrow('File size exceeds limit');
    });
  });
});
