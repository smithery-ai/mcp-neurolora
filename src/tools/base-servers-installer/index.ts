import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { handleInstallBaseServers } from './handler.js';

export const installBaseServersTool: Tool = {
  name: 'install_base_servers',
  description: 'Install base MCP servers to the configuration',
  inputSchema: {
    type: 'object',
    properties: {
      configPath: {
        type: 'string',
        description: 'Path to the MCP settings configuration file',
      },
    },
    required: ['configPath'],
  },
  handler: async (args: Record<string, unknown>) => {
    const configPath = String(args.configPath);
    const result = await handleInstallBaseServers(configPath);

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  },
};
