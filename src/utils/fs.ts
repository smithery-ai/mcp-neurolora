import { Stats } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { FileInfo, LanguageMapping } from '../types/index.js';

/**
 * Map of file extensions to markdown code block languages
 */
export const LANGUAGE_MAP: LanguageMapping = {
  '.py': 'python',
  '.js': 'javascript',
  '.ts': 'typescript',
  '.jsx': 'jsx',
  '.tsx': 'tsx',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.md': 'markdown',
  '.json': 'json',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.bat': 'batch',
  '.ps1': 'powershell',
  '.sql': 'sql',
  '.java': 'java',
  '.cpp': 'cpp',
  '.hpp': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.rs': 'rust',
  '.go': 'go',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.r': 'r',
  '.lua': 'lua',
  '.m': 'matlab',
  '.pl': 'perl',
  '.xml': 'xml',
  '.toml': 'toml',
  '.ini': 'ini',
  '.conf': 'conf',
};

/**
 * Default patterns to ignore when collecting files
 */
export const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '__pycache__',
  '*.pyc',
  'venv',
  '.env',
  'dist',
  'build',
  '.idea',
  '.vscode',
];

/**
 * Maximum file size in bytes (1MB)
 */
export const MAX_FILE_SIZE = 1024 * 1024;

/**
 * Get language identifier for a file extension
 */
export function getLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] || '';
}

/**
 * Create a valid markdown anchor from a path
 */
export function makeAnchor(filePath: string): string {
  return filePath
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Check if a file should be ignored based on patterns
 */
export async function shouldIgnoreFile(
  filePath: string,
  ignorePatterns: string[],
  stats?: Stats
): Promise<boolean> {
  const fileName = path.basename(filePath);

  // Get file stats if not provided
  if (!stats) {
    try {
      stats = await fs.stat(filePath);
    } catch (error) {
      console.error(`Error getting stats for ${filePath}:`, error);
      return true;
    }
  }

  // Skip files larger than MAX_FILE_SIZE
  if (stats.size > MAX_FILE_SIZE) {
    return true;
  }

  // Check against ignore patterns
  return ignorePatterns.some(pattern => {
    if (pattern.endsWith('/')) {
      return filePath.includes(pattern.slice(0, -1));
    }
    return (
      fileName === pattern ||
      filePath.includes(pattern) ||
      (pattern.includes('*') && new RegExp('^' + pattern.replace(/\*/g, '.*') + '$').test(fileName))
    );
  });
}

/**
 * Read file content with proper encoding handling
 */
export async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error reading ${filePath}:`, error.message);
      return `[Error reading file: ${error.message}]`;
    }
    return '[Unknown error reading file]';
  }
}

/**
 * Collect all files from a directory that match criteria
 */
export async function collectFiles(
  directory: string,
  ignorePatterns: string[]
): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  const baseDir = path.resolve(directory);

  async function processDirectory(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (await shouldIgnoreFile(fullPath, ignorePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile()) {
        const content = await readFileContent(fullPath);
        files.push({
          relativePath,
          content,
          language: getLanguage(fullPath),
        });
      }
    }
  }

  await processDirectory(baseDir);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
