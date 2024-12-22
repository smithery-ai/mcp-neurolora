import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import { tools } from './tools/index.js';
import { ConnectionAwareHandler } from './utils/connection-check.js';
import workerPool from './utils/worker-pool.js';
import { ENV, SERVER_CONFIG } from './config.js';
import { getRuntimeConfig } from './runtime-modes.js';
import { logger } from './utils/logger.js';

interface ConnectionAwareTool extends Tool {
  handler: ConnectionAwareHandler;
}

interface ToolHandler {
  handle(args: Record<string, unknown>): Promise<{
    content: Array<{
      type: string;
      text: string;
    }>;
    isError?: boolean;
  }>;
}

/**
 * Main MCP server class for Neurolora functionality
 *
 * IMPORTANT: All paths in tool arguments must be absolute paths!
 * Example:
 * - Correct: "/Users/username/project/file.js"
 * - Incorrect: "src/file.js" or "./file.js"
 *
 * This requirement ensures consistent behavior across different environments
 * and prevents path resolution issues.
 */

/**
 * Server configuration and state management
 */
class ServerConfig {
  public readonly name: string;
  public readonly baseDir: string;

  private constructor(baseDir: string, name: string) {
    this.baseDir = baseDir;
    this.name = name;
  }

  static async create(): Promise<ServerConfig> {
    const runtime = getRuntimeConfig();
    const baseDir = process.argv[1] ? path.resolve(path.dirname(process.argv[1])) : process.cwd();

    const config = new ServerConfig(baseDir, runtime.serverName);

    // Initialize app directories
    const { ensureAppDirectories } = await import('./utils/paths.js');
    await ensureAppDirectories();

    return config;
  }
}

/**
 * Error handler for MCP server
 */
export class ErrorHandler {
  private readonly baseDir: string;

  constructor(private readonly config: ServerConfig) {
    this.baseDir = config.baseDir;
  }

  public formatError(error: Error): string {
    return `${error.message}\n${error.stack}`;
  }

  public logError(error: unknown, context?: string): void {
    logger.error('Error occurred', error instanceof Error ? error : new Error(String(error)), {
      context,
      baseDir: this.baseDir,
      nodeVersion: process.version,
      platform: process.platform,
      workingDirectory: process.cwd(),
    });
  }
}

/**
 * Connection manager for MCP server
 */
export class ConnectionManager {
  public static currentTransport: any;
  private connectionState: 'connected' | 'disconnected' | 'connecting' = 'disconnected';

  constructor(
    private readonly server: Server,
    private readonly errorHandler: ErrorHandler
  ) {}

  private static instance: ConnectionManager | null = null;

  public static getInstance(server: Server, errorHandler: ErrorHandler): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager(server, errorHandler);
    }
    return ConnectionManager.instance;
  }

  public static resetInstance(): void {
    ConnectionManager.instance = null;
    ConnectionManager.currentTransport = null;
  }

  public async connect(transport: any): Promise<void> {
    if (this.connectionState === 'connecting') {
      throw new Error('Connection already in progress');
    }

    // Если уже подключены и транспорт тот же, используем существующее подключение
    if (this.connectionState === 'connected' && transport === ConnectionManager.currentTransport) {
      console.error('[DEBUG] Using existing connection');
      return;
    }

    // Сохраняем транспорт
    ConnectionManager.currentTransport = transport;
    this.connectionState = 'connecting';

    try {
      // Закрываем предыдущее соединение если есть
      await this.server.close().catch(() => {});

      // Инициализируем соединение
      await this.server.connect(transport);

      // Устанавливаем состояние подключения
      this.connectionState = 'connected';

      // Проверяем успешность подключения
      if (!this.server.transport) {
        this.connectionState = 'disconnected';
        throw new Error('Failed to establish connection');
      }
      console.error('✅ Neurolora MCP server connected successfully');
    } catch (error) {
      this.connectionState = 'disconnected';
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  private async reconnect(retryCount = 0, maxRetries = 3): Promise<void> {
    try {
      // Закрываем только если не подключены
      if (this.connectionState === 'disconnected') {
        this.connectionState = 'connecting';
        await this.server.close().catch(() => {}); // Игнорируем ошибки закрытия
        await new Promise(resolve => setTimeout(resolve, 1000)); // Ждем перед переподключением
        await this.server.connect(ConnectionManager.currentTransport);
      }
      this.connectionState = 'connected';
      console.error('✅ Neurolora MCP server connected successfully');
    } catch (error) {
      this.errorHandler.logError(error, 'reconnect');
      if (retryCount < maxRetries) {
        console.error(`Retrying connection (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.reconnect(retryCount + 1, maxRetries);
      } else {
        throw error;
      }
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.server.close();
      this.connectionState = 'disconnected';
      console.error('Server closed successfully');
    } catch (error) {
      this.errorHandler.logError(error, 'disconnect');
      // Не пробрасываем ошибку, так как сервер все равно завершает работу
      this.connectionState = 'disconnected';
    }
  }
}

export class NeuroloraServer {
  private readonly server: Server;
  private readonly config: ServerConfig;
  private readonly errorHandler: ErrorHandler;
  private readonly connectionManager: ConnectionManager;

  private constructor(config: ServerConfig) {
    this.config = config;
    this.errorHandler = new ErrorHandler(this.config);

    // Initialize server
    const serverTools = tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));

    this.server = new Server({
      name: this.config.name,
      version: '1.4.0',
      capabilities: {
        tools: serverTools.reduce((acc, tool) => ({ ...acc, [tool.name]: tool }), {}),
      },
      timeout: ENV.timeoutMs,
    });

    this.connectionManager = ConnectionManager.getInstance(this.server, this.errorHandler);

    // Initialize connection manager for tools
    tools.forEach(tool => {
      const connectionAwareTool = tool as ConnectionAwareTool;
      if (connectionAwareTool.handler?.setConnectionManager) {
        connectionAwareTool.handler.setConnectionManager(this.connectionManager);
      }
    });

    // Show debug info
    logger.info('Server initialized', {
      maxTokens: ENV.maxTokens,
      timeout: ENV.timeoutMs,
      version: SERVER_CONFIG.version,
    });

    this.initializeHandlers();
  }

  static async create(): Promise<NeuroloraServer> {
    const config = await ServerConfig.create();
    return new NeuroloraServer(config);
  }

  private initializeHandlers(): void {
    // Register tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      console.error('\n=== Tool Call Request ===');
      console.error('Request:', JSON.stringify(request, null, 2));
      console.error(
        'Available tools:',
        tools.map(t => t.name)
      );
      if (!this.connectionManager.isConnected()) {
        return {
          content: [
            {
              type: 'text',
              text: 'Server is not connected. Please wait for connection to be established or try reconnecting.',
            },
          ],
          isError: true,
        };
      }

      const tool = tools.find(t => t.name === request.params.name);
      console.error('Found tool:', tool ? tool.name : 'not found');
      if (!tool) {
        return {
          content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
          isError: true,
        };
      }

      try {
        console.error('Tool handler:', tool.handler ? 'present' : 'missing');
        if (!tool.handler) {
          console.error('Tool handler is missing!');
          return {
            content: [{ type: 'text', text: `Tool handler not found for: ${request.params.name}` }],
            isError: true,
          };
        }

        const handler = tool.handler as ToolHandler;
        console.error('Handler type:', typeof handler);
        console.error('Handler properties:', Object.keys(handler));
        console.error('Executing tool:', request.params.name);
        console.error('Tool arguments:', JSON.stringify(request.params.arguments || {}, null, 2));

        if (typeof handler.handle !== 'function') {
          console.error('Tool handler is missing!');
          return {
            content: [{ type: 'text', text: `Tool handler not found for: ${request.params.name}` }],
            isError: true,
          };
        }

        const result = await handler.handle(request.params.arguments || {});
        console.error('Tool execution completed');
        console.error('Result:', JSON.stringify(result, null, 2));
        console.error('=========================');
        return result;
      } catch (error) {
        this.errorHandler.logError(error, 'tool execution');
        return {
          content: [
            {
              type: 'text',
              text: 'Invalid tool arguments. Please check the documentation and try again.',
            },
          ],
          isError: true,
        };
      }
    });

    // Error handling
    this.server.onerror = async error => {
      this.errorHandler.logError(error);
      if (error instanceof Error && error.message.includes('connection')) {
        await this.handleConnectionError();
      }
    };
  }

  private async handleConnectionError(): Promise<void> {
    this.errorHandler.logError(new Error('Connection closed unexpectedly'), 'connection-error');

    console.error('\nAttempting to recover connection...');
    try {
      await this.server.close();
      console.error('Server closed successfully');

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.error('Attempting reconnection...');

      await this.connectionManager.connect(ConnectionManager.currentTransport);
      console.error('Reconnection successful');
    } catch (error) {
      this.errorHandler.logError(error, 'reconnection-failed');
      console.error('\nFailed to recover connection. Please try:');
      console.error('1. Check if any other instances are running');
      console.error('2. Verify MCP configuration is correct');
      console.error('3. Restart the server');
    }
  }

  private async handleShutdown(signal: string): Promise<void> {
    console.error(`\nReceived ${signal}, shutting down...`);
    try {
      // Stop services
      await this.connectionManager.disconnect();
      await workerPool.terminate();

      // Allow async operations to complete before exiting
      setTimeout(() => process.exit(0), 1000);
    } catch (error) {
      this.errorHandler.logError(error, 'shutdown');
      // Try to cleanup even on error
      await workerPool.terminate().catch(() => {});
      process.exit(1);
    }
  }

  /**
   * Kill all existing server processes
   */
  private async getExec(): Promise<any> {
    const { exec } = await import('child_process');
    return exec;
  }

  private async cleanupExistingProcesses(): Promise<void> {
    const exec = await this.getExec();

    if (process.platform === 'win32') {
      // На Windows используем taskkill
      try {
        await new Promise((resolve, reject) => {
          exec(
            'taskkill /F /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq *build/index.js*"',
            (error: any) => {
              // Игнорируем ошибки, так как процессов может не быть
              resolve(null);
            }
          );
        });
      } catch (error) {
        // Игнорируем ошибки очистки
      }
    } else {
      // На Unix системах используем pkill
      try {
        await new Promise((resolve, reject) => {
          exec('pkill -f "node build/index.js"', (error: any) => {
            // Игнорируем ошибки, так как процессов может не быть
            resolve(null);
          });
        });
      } catch (error) {
        // Игнорируем ошибки очистки
      }
    }

    // Ждем немного, чтобы процессы успели завершиться
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async request(request: any): Promise<any> {
    if (request.method === 'tools/call') {
      // Проверяем состояние подключения
      if (!this.connectionManager.isConnected()) {
        console.error('[DEBUG] Server not connected, attempting to reconnect...');
        try {
          await this.connectionManager.connect(ConnectionManager.currentTransport);
        } catch (error) {
          this.errorHandler.logError(error, 'reconnection-failed');
          return {
            result: {
              content: [
                {
                  type: 'text',
                  text: 'Server connection failed. Please try again.',
                },
              ],
              isError: true,
            },
          };
        }
      }

      const tool = tools.find(t => t.name === request.params.name);
      if (!tool) {
        return {
          result: {
            content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
            isError: true,
          },
        };
      }

      try {
        const handler = tool.handler as ToolHandler;
        const result = await handler.handle(request.params.arguments || {});
        return { result };
      } catch (error) {
        this.errorHandler.logError(error, 'tool execution');

        // Если ошибка связана с подключением, пробуем переподключиться и повторить запрос
        if (error instanceof Error && error.message.includes('connection')) {
          console.error('[DEBUG] Connection error detected, attempting to reconnect...');
          try {
            await this.connectionManager.connect(ConnectionManager.currentTransport);
            // Повторяем запрос после переподключения
            const handler = tool.handler as ToolHandler;
            const result = await handler.handle(request.params.arguments || {});
            return { result };
          } catch (retryError) {
            this.errorHandler.logError(retryError, 'retry-failed');
          }
        }

        return {
          result: {
            content: [
              {
                type: 'text',
                text: 'Tool execution failed. Please check the arguments and try again.',
              },
            ],
            isError: true,
          },
        };
      }
    }

    throw new Error(`Unknown method: ${request.method}`);
  }

  async run(transport: any): Promise<void> {
    logger.info('Cleaning up existing processes...');
    await this.cleanupExistingProcesses();

    logger.info('Server starting', { baseDir: this.config.baseDir });

    try {
      await this.connectionManager.connect(transport);

      // Setup signal handlers
      const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
      signals.forEach(signal => {
        process.on(signal, () => this.handleShutdown(signal));
      });
    } catch (error) {
      this.errorHandler.logError(error, 'startup');
      process.exit(1);
    }
  }
}
