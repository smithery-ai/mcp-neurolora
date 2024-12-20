import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
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
 * Validate and ensure output path is writable
 */
export async function validateOutputPath(outputPath?: string): Promise<string> {
  if (!outputPath) {
    throw new Error('Output path is required');
  }

  // Always use absolute paths
  const resolvedPath = path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(process.cwd(), outputPath);
  const dir = path.dirname(resolvedPath);

  // Create directory if it doesn't exist
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.warn(`Failed to create directory: ${error}`);
  }

  // Check if directory is writable
  try {
    await fs.access(dir, fs.constants.W_OK);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Directory is not writable: ${error.message}`);
    }
    throw new Error('Directory is not writable: Unknown error');
  }

  return resolvedPath;
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
    // Save in the same directory as the input
    const tmpDir = path.join(validatedDirectory, '.neurolora');
    outputPath = path.join(tmpDir, `FULL_CODE_${dirName}_${date}.md`);

    // Log the paths for debugging
    console.log('Temp directory:', tmpDir);
    console.log('Output path:', outputPath);
  }

  const validatedOutputPath = await validateOutputPath(outputPath);
  const validatedIgnorePatterns = validateIgnorePatterns(options.ignorePatterns);

  return {
    directory: validatedDirectory,
    outputPath: validatedOutputPath,
    ignorePatterns: validatedIgnorePatterns,
  };
}
