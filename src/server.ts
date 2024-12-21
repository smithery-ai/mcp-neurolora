import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import { tools } from './tools/index.js';

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}>;

/**
 * Main MCP server class for Neurolora functionality
 */
const ENV = {
  isLocal: process.env.MCP_ENV === 'local',
  storagePath: process.env.STORAGE_PATH || 'data',
  maxTokens: parseInt(process.env.MAX_TOKENS || '190000'),
  timeoutMs: parseInt(process.env.TIMEOUT_MS || '300000'),
};

/**
 * Server configuration and state management
 */
class ServerConfig {
  public readonly isLocal: boolean;
  public readonly name: string;
  public readonly baseDir: string;

  constructor() {
    this.isLocal = ENV.isLocal;
    this.name = this.isLocal ? 'local-mcp-neurolora' : '@aindreyway/mcp-neurolora';
    this.baseDir = process.argv[1] ? path.dirname(process.argv[1]) : process.cwd();
  }
}

/**
 * Error handler for MCP server
 */
class ErrorHandler {
  constructor(private readonly config: ServerConfig) {}

  public formatError(error: Error): string {
    return this.config.isLocal
      ? `${error.message}\n${error.stack}`
      : 'An error occurred while processing the request';
  }

  public logError(error: unknown, context?: string): void {
    const prefix = this.config.isLocal ? '[LOCAL VERSION][MCP Error]' : '[MCP Error]';
    console.error(prefix, context ? `[${context}]` : '', error);
  }
}

/**
 * Connection manager for MCP server
 */
class ConnectionManager {
  private currentTransport: any;

  constructor(
    private readonly server: Server,
    private readonly errorHandler: ErrorHandler
  ) {}

  public async connect(transport: any): Promise<void> {
    this.currentTransport = transport;
    await this.reconnect();
  }

  private async reconnect(retryCount = 0, maxRetries = 3): Promise<void> {
    try {
      await this.server.connect(this.currentTransport);
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
    await this.server.close();
    console.error('Server closed successfully');
  }
}

export class NeuroloraServer {
  private readonly server: Server;
  private readonly config: ServerConfig;
  private readonly errorHandler: ErrorHandler;
  private readonly connectionManager: ConnectionManager;

  constructor() {
    this.config = new ServerConfig();
    this.errorHandler = new ErrorHandler(this.config);

    // Initialize server
    this.server = new Server({
      name: this.config.name,
      version: '1.4.0',
      capabilities: {
        tools: {},
      },
      timeout: ENV.timeoutMs,
    });

    this.connectionManager = new ConnectionManager(this.server, this.errorHandler);

    // Show debug info in local mode
    if (this.config.isLocal) {
      console.error('[LOCAL VERSION] Running in development mode');
      console.error(`[LOCAL VERSION] Storage path: ${ENV.storagePath}`);
      console.error(`[LOCAL VERSION] Max tokens: ${ENV.maxTokens}`);
      console.error(`[LOCAL VERSION] Timeout: ${ENV.timeoutMs}ms`);
    }

    this.initializeHandlers();
  }

  private initializeHandlers(): void {
    // Register tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const tool = tools.find(t => t.name === request.params.name);
      if (!tool) {
        return {
          content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
          isError: true,
        };
      }

      try {
        const handler = tool?.handler as ToolHandler;
        return handler(request.params.arguments || {});
      } catch (error) {
        this.errorHandler.logError(error, 'tool execution');
        return {
          content: [{ type: 'text', text: this.errorHandler.formatError(error as Error) }],
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
    console.error('Connection error detected, attempting to reconnect...');
    try {
      await this.server.close();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.connectionManager.connect(this.connectionManager['currentTransport']);
    } catch (error) {
      this.errorHandler.logError(error, 'reconnection');
    }
  }

  private async handleShutdown(signal: string): Promise<void> {
    console.error(`\nReceived ${signal}, shutting down...`);
    try {
      await this.connectionManager.disconnect();
      // Allow async operations to complete before exiting
      setTimeout(() => process.exit(0), 1000);
    } catch (error) {
      this.errorHandler.logError(error, 'shutdown');
      process.exit(1);
    }
  }

  async run(transport: any): Promise<void> {
    console.error('Neurolora MCP server running from:', this.config.baseDir);

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
