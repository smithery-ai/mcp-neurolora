// Base interfaces
export interface CodeIssue {
  title: string;
  body: string;
  labels: string[];
  milestone?: string;
  project?: string;
}

// Options for code analyzer
export interface AnalyzeCodeOptions {
  mode: 'analyze';
  /**
   * Path to the code file to analyze.
   * Must be an absolute path, e.g. '/Users/username/project/src/code.ts'
   */
  input: string;
  /**
   * Path where to save the output files.
   * Must be an absolute path to the project root directory.
   * Example: If your project is at '/Users/username/project',
   * then outputPath should be '/Users/username/project'.
   * All analysis files will be created in the project root.
   */
  outputPath: string;
}

// Results
export interface AnalyzeResult {
  type: 'analyze';
  mdFilePath: string;
  tokenCount: number;
  issues: CodeIssue[];
  files: {
    analysis: string; // Путь к файлу с результатами анализа
    json: string; // Путь к JSON файлу
    prompt: string; // Путь к файлу с собранным кодом
    openCommand: string; // Команда для открытия директории с результатами
  };
}

import { z } from 'zod';

// Zod schema for validation
const zodAnalyzerSchema = z
  .object({
    input: z
      .string({
        description: 'Absolute path to the code file to analyze',
      })
      .regex(/^\/.*/, {
        message: 'Input path must be an absolute path',
      }),
    outputPath: z
      .string({
        description:
          'Absolute path to the project root directory. Analysis files (LAST_RESPONSE_OPENAI.txt and LAST_RESPONSE_OPENAI_GITHUB_FORMAT.json) will be created in this directory.',
      })
      .regex(/^\/.*/, {
        message: 'Output path must be absolute path to project root directory',
      }),
  })
  .strict();

// Convert Zod schema to JSON Schema for MCP SDK
export const codeAnalyzerSchema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      description: 'Absolute path to the code file to analyze',
      pattern: '^/.*',
    },
    outputPath: {
      type: 'string',
      description:
        'Absolute path to the project root directory (e.g., /Users/username/project). All analysis files will be created in the project root directory. Do not specify subdirectories.',
      pattern: '^/.*',
    },
  },
  required: ['input', 'outputPath'],
  additionalProperties: false,
} as const;

// Export type for TypeScript usage
export type CodeAnalyzerInput = z.infer<typeof zodAnalyzerSchema>;

// Validation function using Zod
export function validateAnalyzerInput(input: unknown): CodeAnalyzerInput {
  return zodAnalyzerSchema.parse(input);
}

// Error types
export class OpenAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIError';
  }
}
