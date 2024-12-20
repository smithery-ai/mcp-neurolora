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
 * Validate output path format
 */
export function validateOutputPath(outputPath?: string): string {
  if (!outputPath) {
    throw new Error('Output path is required');
  }
  return path.resolve(outputPath);
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
