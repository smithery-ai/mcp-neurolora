// Types for code collection functionality

/**
 * Options for code collection
 */
export interface CodeCollectorOptions {
  /**
   * Input path(s) to collect code from.
   * Must be absolute paths, e.g. '/Users/username/project/src'
   */
  input: string | string[];

  /**
   * Path where to save the output file.
   * Must be an absolute path, e.g. '/Users/username/project/output.md'
   */
  outputPath: string;

  /**
   * Optional patterns to ignore when collecting files
   */
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
