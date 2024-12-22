export interface ToolHandler {
  handle: (args: unknown) => Promise<any>;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: unknown;
  handler?: ToolHandler;
}

export interface ToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}
