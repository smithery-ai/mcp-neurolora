import { Tool } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import { CodeCollectorOptions } from './types.js';
import { handleCollectCode } from './handler.js';

export const codeCollectorTool: Tool = {
  name: 'collect_code',
  description: 'Collect all code from a directory into a single markdown file',
  inputSchema: {
    type: 'object',
    properties: {
      input: {
        oneOf: [
          {
            type: 'string',
            description: 'Path to directory or file to collect code from',
          },
          {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'List of file paths to collect code from',
          },
        ],
      },
      outputPath: {
        type: 'string',
        description: 'Path where to save the output markdown file',
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
    required: ['input', 'outputPath'],
  },
  handler: async (args: Record<string, unknown>) => {
    try {
      const input = Array.isArray(args.input) ? args.input.map(String) : String(args.input);
      const outputPath = path.resolve(String(args.outputPath));

      const options: CodeCollectorOptions = {
        input,
        outputPath,
        ignorePatterns: args.ignorePatterns as string[] | undefined,
      };

      const result = await handleCollectCode(options);
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
            text: `Error collecting code: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};
