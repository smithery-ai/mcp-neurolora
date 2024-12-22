import { jest, describe, test, expect, beforeAll } from '@jest/globals';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { promises as fs } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock external modules
jest.mock('../src/tools/code-analyzer/handler.js', () => ({
  __esModule: true,
  handleAnalyzeCode: jest.fn()
}));
jest.mock('../src/server.js', () => ({
  __esModule: true,
  ConnectionManager: jest.fn()
}));
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  __esModule: true,
  Server: jest.fn()
}));
jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  __esModule: true,
  StdioServerTransport: jest.fn()
}));

const { handleAnalyzeCode } = await import('../src/tools/code-analyzer/handler.js');
const { ConnectionManager } = await import('../src/server.js');
const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');

function logMemory(label) {
  const used = process.memoryUsage();
  console.log(`\nMemory usage ${label}:`);
  for (let key in used) {
    console.log(`${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`);
  }
}

describe('Code Analyzer Tool', () => {
  // Use process.cwd() to get the project root directory
  const baseDir = process.cwd();

  beforeAll(async () => {
    // Load MCP config path from environment or use default
    const configPath = process.env.MCP_CONFIG_PATH || path.join(process.cwd(), 'test', '__mocks__', 'mcp-config.json');
    const mcpConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
    const mcpEnv = mcpConfig?.mcpServers?.['local-mcp-neurolora']?.env;
    if (mcpEnv) {
      Object.assign(process.env, mcpEnv);
    }

    const server = new Server({
      name: 'test-server',
      version: '1.0.0',
    });

    const transport = new StdioServerTransport();
    const connectionManager = new ConnectionManager(server);
    await connectionManager.connect(transport);

    // Устанавливаем connectionManager для code-collector
    const { codeCollectorHandler } = await import('../build/tools/code-collector/handler.js');
    console.error('[DEBUG] Setting connectionManager');
    codeCollectorHandler.setConnectionManager(connectionManager);
    console.error('[DEBUG] ConnectionManager set');
  });

  test('should analyze code-collector directory', async () => {
    logMemory('initial');

    // Проверяем наличие ключа OpenAI API
    console.log('\n=== Environment ===');
    console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
    console.log('Environment variables:', Object.keys(process.env));

    // Анализируем директорию code-collector
    console.log('\n=== Analyzing code-collector directory ===');
    const result = await handleAnalyzeCode({
      input: `${baseDir}/src/tools/code-collector`,
      outputPath: baseDir,
    });

    expect(result).toBeDefined();
    expect(result.type).toBe('analyze');
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);

    // Ждем завершения анализа
    await new Promise(resolve => setTimeout(resolve, 1000));
    logMemory('after analysis');
  });
});
