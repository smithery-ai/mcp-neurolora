import type { Tool, ToolResult } from './tool.js';

export interface CodeCollectorOptions {
  input: string | string[];
  outputPath: string;
  ignorePatterns?: string[];
}

export interface CodeCollectorResult extends ToolResult {
  status: 'success' | 'error';
  files?: string[];
}

export interface CodeCollectorHandler extends Tool {
  handleCollectCode: (options: CodeCollectorOptions) => Promise<CodeCollectorResult>;
  setConnectionManager: (manager: unknown) => void;
}
