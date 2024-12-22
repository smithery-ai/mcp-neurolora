import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { safeReadFile } from '../utils/safe-fs.js';

// Получаем путь к текущему файлу и директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к шаблонам относительно текущего файла
const TEMPLATES_DIR = path.join(__dirname, 'templates');

let codeAnalysisPrompt: string | null = null;

/**
 * Загрузка шаблона анализа кода
 */
export async function getCodeAnalysisPrompt(): Promise<string> {
  if (!codeAnalysisPrompt) {
    const templatePath = path.join(TEMPLATES_DIR, 'code-analysis.txt');
    codeAnalysisPrompt = await safeReadFile(templatePath);
  }
  return codeAnalysisPrompt;
}
