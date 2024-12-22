import { handleAnalyzeCode } from '../src/tools/code-analyzer/handler.js';
import path from 'path';
import { ConnectionManager } from '../src/server.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs/promises';

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
