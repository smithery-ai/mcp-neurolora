import { TestContext } from './helpers/test-utils.js';
import fs from 'fs/promises';
import path from 'path';

describe('Test Utils', () => {
  let context: TestContext;

  beforeEach(() => {
    context = new TestContext();
  });

  afterEach(async () => {
    await context.cleanup();
  });

  test('should create and cleanup test context', async () => {
    expect(context).toBeDefined();
    await context.setup();
    const tempFile = await context.createTempFile('test');
    expect(await fs.access(tempFile).then(() => true).catch(() => false)).toBe(true);
    await context.cleanup();
    expect(await fs.access(tempFile).then(() => true).catch(() => false)).toBe(false);
  });

  test('should create temporary file', async () => {
    const content = 'test content';
    const filepath = await context.createTempFile(content);
    expect(filepath).toBeDefined();
    const fileContent = await fs.readFile(filepath, 'utf-8');
    expect(fileContent).toBe(content);
  });

  test('should add and execute cleanup functions', async () => {
    let cleaned = false;
    context.addCleanup(async () => {
      cleaned = true;
    });
    await context.cleanup();
    expect(cleaned).toBe(true);
  });
});
