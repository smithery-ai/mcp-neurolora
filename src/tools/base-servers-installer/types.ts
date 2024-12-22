import { z } from 'zod';

// Zod schemas for validation
const zodMcpServerConfig = z
  .object({
    command: z.string(),
    args: z.array(z.string()),
    disabled: z.boolean().optional(),
    alwaysAllow: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
  })
  .strict();

const zodMcpSettings = z
  .object({
    mcpServers: z.record(zodMcpServerConfig),
  })
  .strict();

// Types inferred from Zod schemas
export type McpServerConfig = z.infer<typeof zodMcpServerConfig>;
export type McpSettings = z.infer<typeof zodMcpSettings>;

// Schema for MCP SDK
export const baseServersInstallerSchema = {
  type: 'object',
  properties: {
    configPath: {
      type: 'string',
      description: 'Path to the MCP settings configuration file',
    },
  },
  required: ['configPath'],
  additionalProperties: false,
} as const;

// Validation functions using Zod
export function validateMcpServerConfig(input: unknown): McpServerConfig {
  return zodMcpServerConfig.parse(input);
}

export function validateMcpSettings(input: unknown): McpSettings {
  return zodMcpSettings.parse(input);
}

// Base servers configuration
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
      ALLOW_COMMANDS: 'ls,cat,pwd,grep,wc,touch,find',
    },
    disabled: false,
    alwaysAllow: [],
  },
};
