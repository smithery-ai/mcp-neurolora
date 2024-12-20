# Code Collection: /Users/fadandr/Custom Projects/Custom MCP/aindreyway-mcp-neurolora/src

Source directory: /Users/fadandr/Custom Projects/Custom MCP/aindreyway-mcp-neurolora/src

## Table of Contents

- [index.ts](#index-ts)
- [server.ts](#server-ts)
- [types/index.ts](#types-index-ts)
- [utils/fs.ts](#utils-fs-ts)
- [validators/index.ts](#validators-index-ts)

## Files

### index.ts {#index-ts}
```typescript
#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NeuroloraServer } from './server.js';

/**
 * Main entry point for the Neurolora MCP server
 */
async function main() {
  try {
    const server = new NeuroloraServer();
    const transport = new StdioServerTransport();
    await server.run(transport);
  } catch (error) {
    console.error('Failed to start Neurolora MCP server:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

```

### server.ts {#server-ts}
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import { CodeCollectorOptions } from './types/index.js';
import { collectFiles } from './utils/fs.js';
import { validateOptions } from './validators/index.js';

/**
 * Main MCP server class for code collection functionality
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

    this.setupToolHandlers();

    // Error handling
    this.server.onerror = error => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Set up MCP tool handlers
   */
  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'collect_code',
          description: 'Collect all code from a directory into a single markdown file',
          inputSchema: {
            type: 'object',
            properties: {
              directory: {
                type: 'string',
                description: 'Directory path to collect code from',
              },
              outputPath: {
                type: 'string',
                description: 'Path where to save the output markdown file',
              },
              ignorePatterns: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Patterns to ignore (similar to .gitignore)',
                optional: true,
              },
            },
            required: ['directory'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      if (request.params.name !== 'collect_code') {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }

      try {
        const args = request.params.arguments as Record<string, unknown>;
        const directory = String(args.directory);
        const dirName = directory.split('/').pop()?.toUpperCase() || 'PROJECT';

        // If outputPath is not provided or doesn't match the format, use the standard format
        let outputPath = String(args.outputPath || '');
        if (!outputPath || !outputPath.startsWith('FULL_CODE_')) {
          outputPath = `FULL_CODE_${dirName}.md`;
        }

        const options: CodeCollectorOptions = {
          directory,
          outputPath,
          ignorePatterns: args.ignorePatterns as string[] | undefined,
        };
        const result = await this.handleCollectCode(options);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error collecting code: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Handle collect_code tool execution
   */
  private async handleCollectCode(options: CodeCollectorOptions): Promise<string> {
    // Validate options
    const validatedOptions = await validateOptions(options);

    // Collect files
    const files = await collectFiles(
      validatedOptions.directory,
      validatedOptions.ignorePatterns || []
    );

    if (files.length === 0) {
      return 'No files found matching the criteria';
    }

    // Generate markdown content
    let markdown = `# Code Collection: ${validatedOptions.directory}\n\n`;
    markdown += `Source directory: ${validatedOptions.directory}\n\n`;

    // Table of contents
    markdown += '## Table of Contents\n\n';
    for (const file of files) {
      const anchor = file.relativePath.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      markdown += `- [${file.relativePath}](#${anchor})\n`;
    }

    // File contents
    markdown += '\n## Files\n\n';
    for (const file of files) {
      const anchor = file.relativePath.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      markdown += `### ${file.relativePath} {#${anchor}}\n`;
      markdown += '```' + file.language + '\n';
      markdown += file.content;
      markdown += '\n```\n\n';
    }

    // Write output file
    const outputPath =
      validatedOptions.outputPath ||
      `FULL_CODE_${validatedOptions.directory.split('/').pop()?.toUpperCase() || 'PROJECT'}.md`;
    await fs.writeFile(outputPath, markdown, 'utf-8');

    return `Successfully collected ${files.length} files. Output saved to: ${outputPath}`;
  }

  /**
   * Start the MCP server
   */
  async run(transport: any) {
    await this.server.connect(transport);
    console.error('Neurolora MCP server running');
  }
}

```

### types/index.ts {#types-index-ts}
```typescript
// Types for code collection functionality

export interface CodeCollectorOptions {
  directory: string;
  outputPath?: string;
  ignorePatterns?: string[];
}

export interface FileInfo {
  relativePath: string;
  content: string;
  language: string;
}

export interface CollectionResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface LanguageMapping {
  [key: string]: string;
}

export interface CollectorConfig {
  maxFileSize: number;
  defaultIgnorePatterns: string[];
  encoding: BufferEncoding;
}

```

### utils/fs.ts {#utils-fs-ts}
```typescript
import { Stats } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { FileInfo, LanguageMapping } from '../types/index.js';

/**
 * Map of file extensions to markdown code block languages
 */
export const LANGUAGE_MAP: LanguageMapping = {
  '.py': 'python',
  '.js': 'javascript',
  '.ts': 'typescript',
  '.jsx': 'jsx',
  '.tsx': 'tsx',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.md': 'markdown',
  '.json': 'json',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.bat': 'batch',
  '.ps1': 'powershell',
  '.sql': 'sql',
  '.java': 'java',
  '.cpp': 'cpp',
  '.hpp': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.rs': 'rust',
  '.go': 'go',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.r': 'r',
  '.lua': 'lua',
  '.m': 'matlab',
  '.pl': 'perl',
  '.xml': 'xml',
  '.toml': 'toml',
  '.ini': 'ini',
  '.conf': 'conf',
};

/**
 * Default patterns to ignore when collecting files
 */
export const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '__pycache__',
  '*.pyc',
  'venv',
  '.env',
  'dist',
  'build',
  '.idea',
  '.vscode',
];

/**
 * Maximum file size in bytes (1MB)
 */
export const MAX_FILE_SIZE = 1024 * 1024;

/**
 * Get language identifier for a file extension
 */
export function getLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] || '';
}

/**
 * Create a valid markdown anchor from a path
 */
export function makeAnchor(filePath: string): string {
  return filePath
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Check if a file should be ignored based on patterns
 */
export async function shouldIgnoreFile(
  filePath: string,
  ignorePatterns: string[],
  stats?: Stats
): Promise<boolean> {
  const fileName = path.basename(filePath);

  // Get file stats if not provided
  if (!stats) {
    try {
      stats = await fs.stat(filePath);
    } catch (error) {
      console.error(`Error getting stats for ${filePath}:`, error);
      return true;
    }
  }

  // Skip files larger than MAX_FILE_SIZE
  if (stats.size > MAX_FILE_SIZE) {
    return true;
  }

  // Check against ignore patterns
  return ignorePatterns.some(pattern => {
    if (pattern.endsWith('/')) {
      return filePath.includes(pattern.slice(0, -1));
    }
    return (
      fileName === pattern ||
      filePath.includes(pattern) ||
      (pattern.includes('*') && new RegExp('^' + pattern.replace(/\*/g, '.*') + '$').test(fileName))
    );
  });
}

/**
 * Read file content with proper encoding handling
 */
export async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error reading ${filePath}:`, error.message);
      return `[Error reading file: ${error.message}]`;
    }
    return '[Unknown error reading file]';
  }
}

/**
 * Collect all files from a directory that match criteria
 */
export async function collectFiles(
  directory: string,
  ignorePatterns: string[]
): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  const baseDir = path.resolve(directory);

  async function processDirectory(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (await shouldIgnoreFile(fullPath, ignorePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile()) {
        const content = await readFileContent(fullPath);
        files.push({
          relativePath,
          content,
          language: getLanguage(fullPath),
        });
      }
    }
  }

  await processDirectory(baseDir);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

```

### validators/index.ts {#validators-index-ts}
```typescript
import { promises as fs } from 'fs';
import path from 'path';
import { CodeCollectorOptions } from '../types/index.js';

/**
 * Validate directory path exists and is accessible
 */
export async function validateDirectory(directory: string): Promise<string> {
  try {
    const stats = await fs.stat(directory);
    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory');
    }
    return path.resolve(directory);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid directory: ${error.message}`);
    }
    throw new Error('Invalid directory: Unknown error');
  }
}

/**
 * Validate and ensure output path is writable
 */
export async function validateOutputPath(outputPath?: string): Promise<string> {
  if (!outputPath) {
    throw new Error('Output path is required');
  }

  // Always use absolute paths
  const resolvedPath = path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(process.cwd(), outputPath);
  const dir = path.dirname(resolvedPath);

  console.log('Validating output path:', outputPath);
  console.log('Resolved path:', resolvedPath);
  console.log('Directory:', dir);
  console.log('Current working directory:', process.cwd());

  // Create directory if it doesn't exist
  try {
    console.log('Creating directory:', dir);
    await fs.mkdir(dir, { recursive: true });
    console.log('Directory created successfully');
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.warn(`Failed to create directory: ${err.message || error}`);
    console.warn('Error code:', err.code);
    console.warn('Error message:', err.message);
  }

  // Check if directory is writable
  try {
    console.log('Checking write access to:', dir);
    await fs.access(dir, fs.constants.W_OK);
    console.log('Directory is writable');
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.warn('Write access check failed');
    console.warn('Error code:', err.code);
    console.warn('Error message:', err.message);
    if (error instanceof Error) {
      throw new Error(`Directory is not writable: ${error.message}`);
    }
    throw new Error('Directory is not writable: Unknown error');
  }

  return resolvedPath;
}

/**
 * Validate ignore patterns are valid
 */
export function validateIgnorePatterns(patterns?: string[]): string[] {
  if (!patterns) {
    return [];
  }

  return patterns.filter(pattern => {
    if (typeof pattern !== 'string') {
      console.warn(`Invalid ignore pattern: ${pattern}, must be string`);
      return false;
    }
    if (pattern.trim().length === 0) {
      console.warn('Empty ignore pattern will be skipped');
      return false;
    }
    return true;
  });
}

/**
 * Validate all code collector options
 */
export async function validateOptions(
  options: CodeCollectorOptions
): Promise<CodeCollectorOptions> {
  const validatedDirectory = await validateDirectory(options.directory);
  const dirName = validatedDirectory.split('/').pop()?.toUpperCase() || 'PROJECT';

  // Generate default output path if not provided or doesn't match format
  let outputPath = options.outputPath || '';
  if (!outputPath || !outputPath.startsWith('FULL_CODE_')) {
    // Get current date in YYYY-MM-DD format
    const date = new Date().toISOString().split('T')[0];
    // Save in current working directory
    outputPath = path.join(process.cwd(), `FULL_CODE_${dirName}_${date}.md`);
  }

  const validatedOutputPath = await validateOutputPath(outputPath);
  const validatedIgnorePatterns = validateIgnorePatterns(options.ignorePatterns);

  return {
    directory: validatedDirectory,
    outputPath: validatedOutputPath,
    ignorePatterns: validatedIgnorePatterns,
  };
}

```

