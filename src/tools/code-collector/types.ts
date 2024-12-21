// Options for code collector
export interface CodeCollectorOptions {
  // Путь к директории или файлу, или массив путей к файлам
  input: string | string[];
  outputPath: string;
  ignorePatterns?: string[];
}

// Schema for code collector
export const codeCollectorSchema = {
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
