import { handleCollectCode } from '../src/tools/code-collector/handler.js';
import { handleAnalyzeCode } from '../src/tools/code-analyzer/handler.js';
import path from 'path';

function logMemory(label) {
  const used = process.memoryUsage();
  console.log(`\nMemory usage ${label}:`);
  for (let key in used) {
    console.log(`${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`);
  }
}

describe('Tools Integration Tests', () => {
  const baseDir = process.cwd();

  beforeEach(() => {
    logMemory('initial');
  });

  afterEach(() => {
    logMemory('after test');
  });

  describe('Code Collector', () => {
    it('should collect single file', async () => {
      const result = await handleCollectCode({
        input: path.join(baseDir, 'src', 'tools', 'code-collector', 'handler.ts'),
        outputPath: baseDir,
      });
      expect(result).toBeDefined();
      expect(result.type).toBe('collect');
    });

    it('should collect directory', async () => {
      const result = await handleCollectCode({
        input: path.join(baseDir, 'src', 'tools', 'code-collector'),
        outputPath: baseDir,
      });
      expect(result).toBeDefined();
      expect(result.type).toBe('collect');
    });

    it('should collect multiple files', async () => {
      const result = await handleCollectCode({
        input: [
          path.join(baseDir, 'src', 'tools', 'code-collector', 'handler.ts'),
          path.join(baseDir, 'src', 'tools', 'code-collector', 'types.ts'),
        ],
        outputPath: baseDir,
      });
      expect(result).toBeDefined();
      expect(result.type).toBe('collect');
    });
  });

  describe('Code Analyzer', () => {
    it('should analyze single file', async () => {
      const result = await handleAnalyzeCode({
        input: path.join(baseDir, 'src', 'tools', 'code-collector', 'handler.ts'),
        outputPath: baseDir,
      });
      expect(result).toBeDefined();
      expect(result.type).toBe('analyze');
    });

    it('should analyze directory', async () => {
      const result = await handleAnalyzeCode({
        input: path.join(baseDir, 'src', 'tools', 'code-collector'),
        outputPath: baseDir,
      });
      expect(result).toBeDefined();
      expect(result.type).toBe('analyze');
    });

    it('should analyze multiple files', async () => {
      const result = await handleAnalyzeCode({
        input: [
          path.join(baseDir, 'src', 'tools', 'code-collector', 'handler.ts'),
          path.join(baseDir, 'src', 'tools', 'code-collector', 'types.ts'),
        ],
        outputPath: baseDir,
      });
      expect(result).toBeDefined();
      expect(result.type).toBe('analyze');
    });
  });
});
