export interface CodeCollectorOptions {
  directory: string;
  outputPath: string;
  ignorePatterns?: string[];
}

export interface CollectedFile {
  relativePath: string;
  content: string;
  language: string;
}
