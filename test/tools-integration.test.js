import { tools } from '@src/tools/index';
import { logger } from '@src/utils/logger';
import path from 'path';
import { initializeToolHandler, createTestFile } from './test-utils';
import fs from 'fs/promises';
import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';

jest.setTimeout(30000);

const TEST_TIMEOUT = 30000; // 30 seconds

describe('MCP Tools Integration Tests', () => {
  const baseDir = process.cwd();
  const testDir = path.join(baseDir, 'test', 'sample');

  beforeAll(async () => {
    // Create test directory and file
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, 'test.js'), createTestFile());
  }, 30000);

  afterAll(async () => {
    // Cleanup test files
    await fs.rm(testDir, { recursive: true, force: true });
  });

  // Test each tool
  tools.forEach(tool => {
    describe(`Tool: ${tool.name}`, () => {
      test(`${tool.name} has required properties`, () => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.handler).toBeDefined();
      });

      test(
        `${tool.name} handler works with minimal valid input`,
        async () => {
          // Skip test if handler is not properly initialized
          if (!tool.handler || typeof tool.handler.handle !== 'function') {
            logger.warn(`Handler not properly initialized for tool: ${tool.name}`);
            return;
          }

          const handler = initializeToolHandler(tool.handler);
          let testArgs = {};

          // Prepare test arguments based on tool
          switch (tool.name) {
            case 'collect_code':
              testArgs = {
                input: path.join(testDir, 'test.js'),
                outputPath: baseDir,
              };
              break;
            case 'analyze_code':
              testArgs = {
                input: path.join(testDir, 'test.js'),
                outputPath: baseDir,
              };
              break;
            case 'install_base_servers':
              testArgs = {
                configPath: path.join(testDir, 'test-config.json'),
              };
              break;
            case 'create_github_issues':
              testArgs = {
                owner: 'test-owner',
                repo: 'test-repo',
              };
              break;
            default:
              logger.warn(`No test case defined for tool: ${tool.name}`);
              return; // Skip test if no test case defined
          }

          const result = await handler.handle(testArgs);
          expect(result).toBeDefined();
          expect(result.content).toBeDefined();
          expect(Array.isArray(result.content)).toBe(true);
          expect(result.content.length).toBeGreaterThan(0);
          expect(result.content[0].type).toBeDefined();
          expect(result.content[0].text).toBeDefined();
        },
        TEST_TIMEOUT
      );

      test(`${tool.name} handler properly handles errors`, async () => {
        // Skip test if handler is not properly initialized
        if (!tool.handler || typeof tool.handler.handle !== 'function') {
          logger.warn(`Handler not properly initialized for tool: ${tool.name}`);
          return;
        }

        const handler = initializeToolHandler(tool.handler);
        const invalidArgs = {};

        const result = await handler.handle(invalidArgs);
        expect(result.isError).toBe(true);
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toBeDefined();
      });

      // Test tool-specific functionality
      if (tool.name === 'collect_code') {
        test('collect_code handles multiple files', async () => {
          const handler = initializeToolHandler(tool.handler);
          const testFile2 = path.join(testDir, 'test2.js');
          await fs.writeFile(testFile2, createTestFile('const x = 42;'));

          const result = await handler.handle({
            input: [path.join(testDir, 'test.js'), testFile2],
            outputPath: baseDir,
          });

          expect(result).toBeDefined();
          expect(result.content).toBeDefined();
          expect(result.content.length).toBeGreaterThan(0);
        });
      }

      if (tool.name === 'analyze_code') {
        test('analyze_code provides detailed analysis', async () => {
          const handler = initializeToolHandler(tool.handler);
          const result = await handler.handle({
            input: path.join(testDir, 'test.js'),
            outputPath: baseDir,
          });

          expect(result).toBeDefined();
          expect(result.content).toBeDefined();
          expect(result.content.length).toBeGreaterThan(0);
          expect(result.content[0].text).toContain('Analysis');
        });
      }
    });
  });

  // Test tool interactions
  test(
    'collect_code and analyze_code work together',
    async () => {
      const collectTool = tools.find(t => t.name === 'collect_code');
      const analyzeTool = tools.find(t => t.name === 'analyze_code');

      expect(collectTool).toBeDefined();
      expect(analyzeTool).toBeDefined();

      // Skip test if handlers are not properly initialized
      if (!collectTool.handler || !analyzeTool.handler) {
        logger.warn('Tool handlers not properly initialized');
        return;
      }

      // Initialize handlers
      const collectHandler = initializeToolHandler(collectTool.handler);
      const analyzeHandler = initializeToolHandler(analyzeTool.handler);

      // First collect code
      const collectResult = await collectHandler.handle({
        input: path.join(testDir, 'test.js'),
        outputPath: baseDir,
      });

      expect(collectResult).toBeDefined();
      expect(collectResult.content).toBeDefined();
      expect(collectResult.content.length).toBeGreaterThan(0);

      // Then analyze the collected code
      const analyzeResult = await analyzeHandler.handle({
        input: path.join(testDir, 'test.js'),
        outputPath: baseDir,
      });

      expect(analyzeResult).toBeDefined();
      expect(analyzeResult.content).toBeDefined();
      expect(analyzeResult.content.length).toBeGreaterThan(0);
    },
    TEST_TIMEOUT
  );
});
