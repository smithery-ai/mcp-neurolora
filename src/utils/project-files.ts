import path from 'path';
import { safeWriteFile } from './safe-fs.js';

/**
 * Create a file at the specified path
 */
export async function createProjectFile(
  filename: string,
  content: string,
  outputPath: string,
  options = { append: false }
): Promise<string> {
  // Используем переданный путь как есть
  const filePath = outputPath;

  // Записываем файл
  await safeWriteFile(filePath, content, { append: options.append });

  return filePath;
}

/**
 * Create a code collection file at the specified path
 */
export async function createCodeCollectionFile(
  inputPath: string,
  content: string,
  outputPath: string
): Promise<string> {
  // Используем путь как есть, без модификации
  await safeWriteFile(outputPath, content, { append: false });
  return outputPath;
}

/**
 * Create an analysis file at the specified path
 */
export async function createAnalysisFile(
  filename: string,
  content: string,
  baseDir: string,
  options = { append: false }
): Promise<string> {
  const outputPath = path.join(baseDir, filename);
  return createProjectFile('', content, outputPath, options);
}
