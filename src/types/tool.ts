import { Tool } from '@modelcontextprotocol/sdk/types.js';

export type ToolHandler = Tool['handler'];

export interface ToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}
