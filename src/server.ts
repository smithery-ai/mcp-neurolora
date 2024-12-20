import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import { CodeCollectorOptions } from './types/index.js';
import { collectFiles } from './utils/fs.js';
import { safeWriteFile } from './utils/safe-fs.js';
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
                description:
                  'Path where to save the output markdown file (must be inside the input directory)',
                pattern: '^/.*',
                examples: ['/path/to/project/src/FULL_CODE_SRC_2024-12-20.md'],
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
            required: ['directory', 'outputPath'],
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

        // Convert to absolute path if relative
        const outputPath = path.resolve(String(args.outputPath));

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

    // Write output file using safe file system operations
    await safeWriteFile(validatedOptions.outputPath, markdown);

    return `Successfully collected ${files.length} files. Output saved to: ${validatedOptions.outputPath}`;
  }

  /**
   * Start the MCP server
   */
  async run(transport: any) {
    await this.server.connect(transport);
    console.error('Neurolora MCP server running');
  }
}
