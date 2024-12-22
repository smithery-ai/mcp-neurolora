import { z } from 'zod';
import path from 'path';

// Options for code collector
export interface CodeCollectorOptions {
  // Путь к директории или файлу, или массив путей к файлам
  input: string | string[];
  outputPath: string;
  ignorePatterns?: string[];
}

// Response interface
export interface CodeCollectorSuccessResponse {
  status: 'success';
  filesCount: number;
  outputPath: string;
  message: string;
}

export interface CodeCollectorErrorResponse {
  status: 'error';
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export type CodeCollectorResponse = CodeCollectorSuccessResponse | CodeCollectorErrorResponse;

// Zod schema for validation
const zodCollectorSchema = z
  .object({
    input: z.union([
      z.string({
        description:
          'Absolute path to directory or file to collect code from (must start with / on Unix or C:\\ on Windows)',
      }),
      z.array(z.string(), {
        description:
          'List of absolute file paths to collect code from (each must start with / on Unix or C:\\ on Windows)',
      }),
    ]),
    outputPath: z
      .string({
        description:
          'Absolute path to the project root directory. The collected code will be saved as FULL_CODE_[INPUT_NAME].md in this directory, where [INPUT_NAME] is derived from the input path.',
      })
      .refine(p => path.isAbsolute(p), {
        message:
          'Output path must be absolute path to project root directory (e.g. /path/to/dir on Unix or C:\\path\\to\\dir on Windows)',
      }),
    ignorePatterns: z
      .array(z.string(), {
        description: 'Patterns to ignore (similar to .gitignore)',
      })
      .optional(),
  })
  .strict();

// Convert Zod schema to JSON Schema for MCP SDK
export const codeCollectorSchema = {
  type: 'object',
  properties: {
    input: {
      oneOf: [
        {
          type: 'string',
          description:
            'Absolute path to directory or file to collect code from (must start with / on Unix or C:\\ on Windows)',
        },
        {
          type: 'array',
          items: {
            type: 'string',
          },
          description:
            'List of absolute file paths to collect code from (each must start with / on Unix or C:\\ on Windows)',
        },
      ],
    },
    outputPath: {
      type: 'string',
      description:
        'Absolute path to the project root directory. The collected code will be saved as FULL_CODE_[INPUT_NAME].md in this directory, where [INPUT_NAME] is derived from the input path.',
    },
    ignorePatterns: {
      type: 'array',
      items: {
        type: 'string',
      },
      description: 'Patterns to ignore (similar to .gitignore)',
    },
  },
  required: ['input', 'outputPath'],
  additionalProperties: false,
} as const;

// Export type for TypeScript usage
export type CodeCollectorInput = z.infer<typeof zodCollectorSchema>;

// Validation function using Zod
export function validateCollectorInput(input: unknown): CodeCollectorInput {
  return zodCollectorSchema.parse(input);
}
