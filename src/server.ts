import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  RequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}>;
import { tools } from './tools/index.js';

/**
 * Main MCP server class for Neurolora functionality
 */
export class NeuroloraServer {
  private server: Server;

  constructor() {
    this.server = new Server({
      name: '@aindreyway/mcp-neurolora',
      version: '1.0.0',
      capabilities: {
        tools: {},
      },
    });

    // Register tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));

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

      const handler = tool?.handler as ToolHandler;
      return handler(request.params.arguments || {});
    });

    // Error handling
    this.server.onerror = error => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Start the MCP server
   */
  async run(transport: any) {
    await this.server.connect(transport);
    console.error('Neurolora MCP server running');
  }
}
