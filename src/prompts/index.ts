import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { safeReadFile } from '../utils/safe-fs.js';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to templates relative to current file
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
