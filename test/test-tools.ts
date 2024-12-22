import { jest } from '@jest/globals';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock external modules
jest.mock('../src/tools/index.js');
jest.mock('../src/utils/logger.js');

describe('Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize tools correctly', async () => {
    const { tools } = await import('../src/tools/index.js');
    expect(tools).toBeDefined();
  });

  it('should handle tool registration', async () => {
    const { tools } = await import('../src/tools/index.js');
    const { logger } = await import('../src/utils/logger.js');

    expect(tools.length).toBeGreaterThan(0);
    expect(logger.info).toHaveBeenCalled();
  });
});
