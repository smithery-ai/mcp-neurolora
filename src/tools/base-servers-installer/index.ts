import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { handleInstallBaseServers } from './handler.js';
import { baseServersInstallerSchema } from './types.js';

export const installBaseServersTool: Tool = {
  name: 'install_base_servers',
  description: 'Install base MCP servers to the configuration',
  inputSchema: baseServersInstallerSchema,
  handler: async (args: Record<string, unknown>) => {
    try {
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
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error installing base servers: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};
