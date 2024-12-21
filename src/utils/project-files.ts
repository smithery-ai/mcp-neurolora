import path from 'path';
import { safeWriteFile } from './safe-fs.js';

/**
 * Create a file in the project root directory
 */
export async function createProjectFile(
  filename: string,
  content: string,
  options = { append: false }
): Promise<string> {
  // Используем абсолютный путь к корню проекта
  const projectRoot = path.resolve(process.cwd(), '..');
  const filePath = path.join(projectRoot, filename);

  // Записываем файл
  await safeWriteFile(filePath, content, options.append);

  return filePath;
}

/**
 * Create a code collection file in the project root directory
 */
export async function createCodeCollectionFile(
  inputPath: string,
  content: string
): Promise<string> {
  const date = new Date().toISOString().split('T')[0];
  const inputName = path.basename(inputPath).toUpperCase();
  const filename = `PROMPT_FULL_CODE_${inputName}_${date}.md`;

  return createProjectFile(filename, content);
}

/**
 * Create an analysis file in the project root directory
 */
export async function createAnalysisFile(
  filename: string,
  content: string,
  options = { append: false }
): Promise<string> {
  return createProjectFile(filename, content, options);
}
