import { jest, describe, test, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { promises as fs } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock external modules
jest.mock('../src/tools/code-collector/handler.js', () => ({
  __esModule: true,
  handleCollectCode: jest.fn()
}));
jest.mock('../src/server.js', () => ({
  __esModule: true,
  ConnectionManager: jest.fn()
}));

const { handleCollectCode } = await import('../src/tools/code-collector/handler.js');
const { ConnectionManager } = await import('../src/server.js');

describe('Code Collector Tool', () => {
  // Use process.cwd() to get the project root directory
  const baseDir = process.cwd();
  const sampleProjectDir = path.join(baseDir, 'test', 'sample', 'project-structure');
  const outputDir = path.join(baseDir, 'test', 'output');

  // Вспомогательные функции
  async function getCollectedFileContent(fileName) {
    const files = await fs.readdir(outputDir);
    const collectedFile = files.find(f => f.startsWith('PROMPT_ANALYZE_' + fileName));
    expect(collectedFile).toBeDefined();
    return fs.readFile(path.join(outputDir, collectedFile), 'utf-8');
  }

  // Подготовка и очистка
  beforeAll(async () => {
    await fs.mkdir(outputDir, { recursive: true });
  });

  afterEach(async () => {
    const files = await fs.readdir(outputDir);
    await Promise.all(files.map(file => fs.unlink(path.join(outputDir, file))));
  });

  afterAll(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  describe('File Collection', () => {
    test('should collect single TypeScript file', async () => {
      await handleCollectCode({
        input: path.join(sampleProjectDir, 'src', 'app.ts'),
        outputPath: outputDir,
      });

      const content = await getCollectedFileContent('APP');
      expect(content).toContain('export function calculate');
      expect(content).not.toMatch(/### .*\.git\/.*/);
    });

    test('should collect directory excluding .git', async () => {
      await handleCollectCode({
        input: sampleProjectDir,
        outputPath: outputDir,
      });

      const content = await getCollectedFileContent('PROJECT-STRUCTURE');
      expect(content).toContain('export function calculate');
      expect(content).not.toMatch(/### .*\.git\/.*/);
      expect(content).not.toContain('repositoryformatversion');
    });

    test('should collect multiple files', async () => {
      // Создаем дополнительный тестовый файл
      const utilsPath = path.join(sampleProjectDir, 'src', 'utils.ts');
      await fs.writeFile(utilsPath, 'export const multiply = (a: number, b: number) => a * b;');

      try {
        await handleCollectCode({
          input: [path.join(sampleProjectDir, 'src', 'app.ts'), utilsPath],
          outputPath: outputDir,
        });

        const content = await getCollectedFileContent('COMBINED');
        expect(content).toContain('export function calculate');
        expect(content).toContain('export const multiply');
        expect(content).not.toMatch(/### .*\.git\/.*/);
      } finally {
        await fs.unlink(utilsPath);
      }
    });

    test('should respect ignore patterns', async () => {
      // Используем существующую структуру с .git
      await handleCollectCode({
        input: sampleProjectDir,
        outputPath: outputDir,
        ignorePatterns: ['.git/', 'node_modules/'],
      });

      const content = await getCollectedFileContent('PROJECT-STRUCTURE');

      // Проверяем наличие функционального кода
      expect(content).toContain('export function calculate');

      // Проверяем отсутствие файлов из .git
      expect(content).not.toMatch(/### .*\.git\/.*/);
      expect(content).not.toContain('repositoryformatversion');
      expect(content).not.toContain('logallrefupdates');
    });
  });
});
