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

export class NeuroloraServer {
  private server: Server;
  private isLocal: boolean;

  constructor() {
    this.isLocal = ENV.isLocal;
    const serverName = this.isLocal ? 'local-mcp-neurolora' : '@aindreyway/mcp-neurolora';

    // Инициализация сервера с учетом режима работы
    this.server = new Server({
      name: serverName,
      version: '1.0.0',
      capabilities: {
        tools: {},
      },
      timeout: ENV.timeoutMs,
    });

    // Дополнительная отладочная информация в локальном режиме
    if (this.isLocal) {
      console.error('[LOCAL VERSION] Running in development mode');
      console.error(`[LOCAL VERSION] Storage path: ${ENV.storagePath}`);
      console.error(`[LOCAL VERSION] Max tokens: ${ENV.maxTokens}`);
      console.error(`[LOCAL VERSION] Timeout: ${ENV.timeoutMs}ms`);
    }

    // Register tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const tool = tools.find(t => t.name === request.params.name);
      if (!tool) {
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${request.params.name}`,
            },
          ],
          isError: true,
        };
      }

      try {
        const handler = tool?.handler as ToolHandler;
        return handler(request.params.arguments || {});
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Error handling с учетом режима работы
    this.server.onerror = async error => {
      const prefix = this.isLocal ? '[LOCAL VERSION][MCP Error]' : '[MCP Error]';
      console.error(prefix, error);

      // Если это ошибка подключения, пробуем переподключиться
      if (error instanceof Error && error.message.includes('connection')) {
        console.error('Connection error detected, attempting to reconnect...');
        try {
          await this.server.close();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.reconnect(this.currentTransport);
        } catch (reconnectError) {
          console.error('Failed to reconnect:', reconnectError);
        }
      }
    };
  }

  /**
   * Start the MCP server
   */
  private currentTransport: any;

  private async reconnect(transport: any, retryCount = 0, maxRetries = 3) {
    this.currentTransport = transport;
    try {
      await this.server.connect(transport);
      console.error('✅ Neurolora MCP server connected successfully');
    } catch (error) {
      if (retryCount < maxRetries) {
        console.error(`Retrying connection (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Ждем секунду перед повторной попыткой
        await this.reconnect(transport, retryCount + 1, maxRetries);
      } else {
        throw error;
      }
    }
  }

  async run(transport: any) {
    // Устанавливаем рабочую директорию в директорию запуска сервера
    const serverDir = process.argv[1] ? path.dirname(process.argv[1]) : process.cwd();
    process.chdir(serverDir);
    console.error('Neurolora MCP server running from:', serverDir);

    try {
      await this.reconnect(transport);
    } catch (error) {
      console.error('Failed to connect after retries:', error);
      process.exit(1);
    }

    // Обработка сигналов для graceful shutdown
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.error(`\nReceived ${signal}, shutting down...`);
        try {
          await this.server.close();
          console.error('Server closed successfully');
        } catch (error) {
          console.error('Error during shutdown:', error);
        }
        process.exit(0);
      });
    });
  }
}
