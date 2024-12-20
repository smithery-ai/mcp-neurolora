export interface McpServerConfig {
  command: string;
  args: string[];
  disabled?: boolean;
  alwaysAllow?: string[];
  env?: Record<string, string>;
}

export interface McpSettings {
  mcpServers: Record<string, McpServerConfig>;
}

export const BASE_SERVERS: Record<string, McpServerConfig> = {
  fetch: {
    command: 'uvx',
    args: ['mcp-server-fetch'],
    disabled: false,
    alwaysAllow: [],
  },
  puppeteer: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer@latest'],
    disabled: false,
    alwaysAllow: [],
  },
  'sequential-thinking': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking@latest'],
    disabled: false,
    alwaysAllow: [],
  },
  github: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github@latest'],
    disabled: false,
    alwaysAllow: [],
  },
  git: {
    command: 'uvx',
    args: ['mcp-server-git'],
    disabled: false,
    alwaysAllow: [],
  },
  shell: {
    command: 'uvx',
    args: ['mcp-shell-server'],
    env: {
      ALLOW_COMMANDS: 'ls,cat,pwd,grep,wc,touch,find', // Команды уже разделены запятыми
    },
    disabled: false,
    alwaysAllow: [],
  },
};
