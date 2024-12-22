import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { CodeCollectorOptions } from '../src/types/code-collector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock external modules
jest.mock('../src/tools/code-collector/handler.js');
jest.mock('../src/utils/logger.js');
jest.mock('chalk', () => ({
  __esModule: true,
  green: (str: string) => str,
  yellow: (str: string) => str,
  red: (str: string) => str,
  default: {
    green: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str
  }
}));

describe('Code Collector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should collect code from files', async () => {
    const { codeCollectorHandler } = await import('../src/tools/code-collector/handler.js');
    const options: CodeCollectorOptions = {
      input: path.join(__dirname, 'fixtures'),
      outputPath: path.join(__dirname, 'output')
    };

    await codeCollectorHandler.handleCollectCode(options);
    expect(codeCollectorHandler.handleCollectCode).toHaveBeenCalledWith(options);
  });
});
