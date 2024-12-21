import { promises as fs } from 'fs';
import path from 'path';
import { CodeCollectorOptions } from '../types/index.js';
import { DEFAULT_IGNORE_PATTERNS } from '../utils/fs.js';

/**
 * Validate input path exists and is accessible
 */
export async function validateInput(input: string | string[]): Promise<string | string[]> {
  if (Array.isArray(input)) {
    // Проверяем каждый путь в массиве
    const validatedPaths = await Promise.all(
      input.map(async filePath => {
        try {
          const stats = await fs.stat(filePath);
          if (!stats.isFile() && !stats.isDirectory()) {
            throw new Error(`Invalid path: ${filePath} is neither a file nor a directory`);
          }
          return filePath;
        } catch (error) {
          throw new Error(`Invalid path: ${(error as Error).message}`);
        }
      })
    );
    return validatedPaths;
  } else {
    // Проверяем одиночный путь
    try {
      const stats = await fs.stat(input);
      if (!stats.isFile() && !stats.isDirectory()) {
        throw new Error('Path is neither a file nor a directory');
      }
      return input;
    } catch (error) {
      throw new Error(`Invalid path: ${(error as Error).message}`);
    }
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
  const validatedInput = await validateInput(options.input);

  // Определяем имя для выходного файла
  const inputName = Array.isArray(options.input)
    ? 'MULTIPLE_FILES'
    : path.basename(options.input).toUpperCase();

  // Get current date in YYYY-MM-DD format
  const date = new Date().toISOString().split('T')[0];

  // Always save in project root directory
  let outputPath = options.outputPath || '';
  if (!outputPath) {
    const projectRoot = process.cwd();
    outputPath = path.join(projectRoot, `PROMPT_FULL_CODE_${inputName}_${date}.md`);
  }

  const validatedOutputPath = await validateOutputPath(outputPath);
  const validatedIgnorePatterns = validateIgnorePatterns(
    options.ignorePatterns || DEFAULT_IGNORE_PATTERNS
  );

  return {
    input: validatedInput,
    outputPath: validatedOutputPath,
    ignorePatterns: validatedIgnorePatterns,
  };
}
