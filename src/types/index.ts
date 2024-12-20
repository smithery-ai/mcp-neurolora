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
