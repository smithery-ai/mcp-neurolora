import { installBaseServersTool } from './base-servers-installer/index.js';
import { codeAnalyzerTool } from './code-analyzer/index.js';
import { codeCollectorTool } from './code-collector/index.js';
import { githubIssuesTool } from './github-issues/index.js';

export const tools = [
  codeCollectorTool,
  installBaseServersTool,
  codeAnalyzerTool,
  githubIssuesTool,
];
