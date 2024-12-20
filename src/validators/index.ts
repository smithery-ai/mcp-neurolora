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

  console.log('Validating output path:', outputPath);
  console.log('Resolved path:', resolvedPath);
  console.log('Directory:', dir);
  console.log('Current working directory:', process.cwd());

  // Create directory if it doesn't exist
  try {
    console.log('Creating directory:', dir);
    await fs.mkdir(dir, { recursive: true });
    console.log('Directory created successfully');
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.warn(`Failed to create directory: ${err.message || error}`);
    console.warn('Error code:', err.code);
    console.warn('Error message:', err.message);
  }

  // Check if directory is writable
  try {
    console.log('Checking write access to:', dir);
    await fs.access(dir, fs.constants.W_OK);
    console.log('Directory is writable');
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    console.warn('Write access check failed');
    console.warn('Error code:', err.code);
    console.warn('Error message:', err.message);
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
    // Save in user's Desktop directory
    const userDesktop = path.join(os.homedir(), 'Desktop');
    outputPath = path.join(userDesktop, `FULL_CODE_${dirName}_${date}.md`);

    // Log paths for debugging
    console.log('User desktop:', userDesktop);
    console.log('Directory name:', dirName);
    console.log('Generated output path:', outputPath);
    console.log('Process cwd:', process.cwd());
    console.log('Process uid:', process.getuid?.());
    console.log('Process gid:', process.getgid?.());
  }

  const validatedOutputPath = await validateOutputPath(outputPath);
  const validatedIgnorePatterns = validateIgnorePatterns(options.ignorePatterns);

  return {
    directory: validatedDirectory,
    outputPath: validatedOutputPath,
    ignorePatterns: validatedIgnorePatterns,
  };
}
