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
  codePath: string;
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

// Schema for code analyzer
export const codeAnalyzerSchema = {
  type: 'object',
  properties: {
    codePath: {
      type: 'string',
      description:
        'Absolute path to the code file to analyze (e.g. /Users/username/project/src/code.ts)',
    },
  },
  required: ['codePath'],
  additionalProperties: false,
} as const;

// Error types
export class OpenAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIError';
  }
}
