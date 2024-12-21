import { promises as fs, Stats } from 'fs';
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
  'coverage',
  '.next',
  '.nuxt',
  '.cache',
  '*.log',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.DS_Store',
  'Thumbs.db',
  '*.swp',
  '*.swo',
  '*.bak',
  '*.tmp',
  '*.temp',
  '*.o',
  '*.obj',
  '*.class',
  '*.exe',
  '*.dll',
  '*.so',
  '*.dylib',
  '*.min.js',
  '*.min.css',
  '*.map',
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
 * Process a single file and return its info
 */
async function processFile(filePath: string, baseDir: string): Promise<FileInfo | null> {
  // Используем path.join для объединения путей
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const relativePath = path.relative(baseDir, fullPath);

  try {
    const stats = await fs.stat(fullPath);
    if (!stats.isFile()) {
      return null;
    }

    const content = await readFileContent(fullPath);
    return {
      relativePath,
      content,
      language: getLanguage(fullPath),
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Process a directory recursively
 */
async function processDirectory(
  dirPath: string,
  baseDir: string,
  ignorePatterns: string[]
): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  // Убеждаемся, что dirPath абсолютный
  const absoluteDirPath = path.isAbsolute(dirPath) ? dirPath : path.join(process.cwd(), dirPath);
  const entries = await fs.readdir(absoluteDirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(absoluteDirPath, entry.name);

    if (await shouldIgnoreFile(fullPath, ignorePatterns)) {
      continue;
    }

    if (entry.isDirectory()) {
      const subDirFiles = await processDirectory(fullPath, baseDir, ignorePatterns);
      files.push(...subDirFiles);
    } else if (entry.isFile()) {
      const fileInfo = await processFile(fullPath, baseDir);
      if (fileInfo) {
        files.push(fileInfo);
      }
    }
  }

  return files;
}

/**
 * Collect files from input (directory, file, or array of files)
 */
export async function collectFiles(
  input: string | string[],
  ignorePatterns: string[]
): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  const inputs = Array.isArray(input) ? input : [input];
  const projectRoot = process.cwd();

  console.log('Project root:', projectRoot);
  console.log('Input paths:', inputs);

  // Преобразуем все пути в абсолютные относительно текущей директории
  const resolvedInputs = inputs.map(item => {
    const resolvedPath = path.isAbsolute(item) ? item : path.join(projectRoot, item);
    console.log(`Resolving path: ${item} -> ${resolvedPath}`);
    return resolvedPath;
  });

  // Всегда используем корень проекта как базовую директорию
  const baseDir = projectRoot;
  console.log('Base directory:', baseDir);

  for (const fullPath of resolvedInputs) {
    try {
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        const dirFiles = await processDirectory(fullPath, fullPath, ignorePatterns);
        files.push(...dirFiles);
      } else if (stats.isFile()) {
        const fileInfo = await processFile(fullPath, baseDir);
        if (fileInfo) {
          files.push(fileInfo);
        }
      }
    } catch (error) {
      console.error(`Error processing ${fullPath}:`, error);
    }
  }

  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
