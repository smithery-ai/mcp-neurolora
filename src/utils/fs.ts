import { promises as fs, Stats } from 'fs';
import path from 'path';
import { config } from '../config/index.js';
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
export const DEFAULT_IGNORE_PATTERNS = config.fs.defaultIgnorePatterns;

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
 * Validate and sanitize ignore pattern
 */
// Cache for ignore file results with timestamps
const ignoreResultCache = new Map<string, { result: boolean; timestamp: number }>();

// Cache for compiled regex patterns with usage tracking
const regexCache = new Map<string, { pattern: RegExp; lastUsed: number }>();

/**
 * Simple pattern matching for file/directory names
 */
function matchesPattern(name: string, pattern: string): boolean {
  // Если паттерн не содержит звездочку, проверяем точное совпадение
  if (!pattern.includes('*')) {
    return name === pattern;
  }

  // Для простых паттернов вида *.ext
  if (pattern.startsWith('*') && pattern.indexOf('*', 1) === -1) {
    return name.endsWith(pattern.slice(1));
  }

  // Для простых паттернов вида prefix.*
  if (pattern.endsWith('*') && pattern.indexOf('*') === pattern.length - 1) {
    return name.startsWith(pattern.slice(0, -1));
  }

  // Для всех остальных случаев используем простое сравнение
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(name);
}

/**
 * Check if a file should be ignored based on patterns with caching
 */
export async function shouldIgnoreFile(
  filePath: string,
  ignorePatterns: string[],
  stats?: Stats
): Promise<boolean> {
  // Check cache first
  const cacheKey = `${filePath}:${ignorePatterns.join(',')}`;
  if (ignoreResultCache.has(cacheKey)) {
    return ignoreResultCache.get(cacheKey)!.result;
  }

  const fileName = path.basename(filePath);
  const now = Date.now();

  // Get file stats if not provided
  if (!stats) {
    try {
      stats = await fs.stat(filePath);
    } catch {
      ignoreResultCache.set(cacheKey, { result: true, timestamp: now });
      return true;
    }
  }

  // Skip files larger than maxFileSize
  if (stats.size > config.fs.maxFileSize) {
    ignoreResultCache.set(cacheKey, { result: true, timestamp: now });
    return true;
  }

  // Get cached file patterns
  const filePatterns = getFilePatterns(ignorePatterns);

  // Check exact matches first (faster)
  if (filePatterns.includes(fileName)) {
    ignoreResultCache.set(cacheKey, { result: true, timestamp: now });
    return true;
  }

  // Разделяем паттерны на простые и regex
  const simplePatterns = filePatterns.filter(p => !p.includes('*'));
  const regexPatterns = filePatterns.filter(p => p.includes('*'));

  // Сначала проверяем простые паттерны (быстрее)
  if (simplePatterns.includes(fileName)) {
    ignoreResultCache.set(cacheKey, { result: true, timestamp: now });
    return true;
  }

  // Проверяем regex паттерны
  if (regexPatterns.some(pattern => matchesPattern(fileName, pattern))) {
    ignoreResultCache.set(cacheKey, { result: true, timestamp: now });
    return true;
  }

  ignoreResultCache.set(cacheKey, { result: false, timestamp: now });
  return false;
}

class FileOperationError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'FileOperationError';
  }
}

// Максимальный размер файла для кэширования
const MAX_CACHE_FILE_SIZE = 100 * 1024; // 100KB

// Cache for file contents with size tracking
const fileContentCache = new Map<string, { content: string; timestamp: number; size: number }>();
let totalCacheSize = 0;
const MAX_TOTAL_CACHE_SIZE = 5 * 1024 * 1024; // 5MB
const FILE_CACHE_TTL = 5000; // 5 seconds

/**
 * Read file content with optimized caching and streaming for large files
 */
export async function readFileContent(filePath: string): Promise<string> {
  const now = Date.now();
  const cached = fileContentCache.get(filePath);

  if (cached && now - cached.timestamp < FILE_CACHE_TTL) {
    return cached.content;
  }

  try {
    const stats = await fs.stat(filePath);

    // Для больших файлов используем потоковое чтение
    if (stats.size > MAX_CACHE_FILE_SIZE) {
      return await new Promise((resolve, reject) => {
        let content = '';
        const stream = require('fs').createReadStream(filePath, { encoding: 'utf-8' });

        stream.on('data', (chunk: string) => {
          content += chunk;
        });

        stream.on('end', () => {
          resolve(content);
        });

        stream.on('error', (error: Error) => {
          reject(new FileOperationError(`Error reading file ${filePath}: ${error.message}`, error));
        });
      });
    }

    // Для небольших файлов используем кэширование
    const content = await fs.readFile(filePath, 'utf-8');

    // Очищаем кэш если он слишком большой
    if (totalCacheSize > MAX_TOTAL_CACHE_SIZE) {
      const oldestEntry = Array.from(fileContentCache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )[0];
      if (oldestEntry) {
        totalCacheSize -= oldestEntry[1].size;
        fileContentCache.delete(oldestEntry[0]);
      }
    }

    // Добавляем файл в кэш
    const size = Buffer.byteLength(content, 'utf-8');
    totalCacheSize += size;
    fileContentCache.set(filePath, { content, timestamp: now, size });

    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new FileOperationError(
      `Error reading file ${filePath}: ${message}`,
      error instanceof Error ? error : undefined
    );
  }
}

// Cache for file info
const fileInfoCache = new Map<string, { info: FileInfo | null; timestamp: number }>();

/**
 * Process a single file and return its info with caching
 */
async function processFile(filePath: string, baseDir: string): Promise<FileInfo | null> {
  if (!path.isAbsolute(filePath)) {
    throw new Error(`File path must be absolute. Got: ${filePath}`);
  }
  const relativePath = path.relative(baseDir, filePath);
  const now = Date.now();
  const cached = fileInfoCache.get(filePath);

  if (cached && now - cached.timestamp < FILE_CACHE_TTL) {
    return cached.info;
  }

  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      fileInfoCache.set(filePath, { info: null, timestamp: now });
      return null;
    }

    const content = await readFileContent(filePath);
    const info = {
      relativePath,
      content,
      language: getLanguage(filePath),
    };

    fileInfoCache.set(filePath, { info, timestamp: now });
    return info;
  } catch (error) {
    // Cache errors as null results
    fileInfoCache.set(filePath, { info: null, timestamp: now });
    return null;
  }
}

/**
 * Maximum recursion depth for directory traversal
 */
const MAX_RECURSION_DEPTH = config.fs.maxRecursionDepth;

// Maximum number of files to process
const MAX_FILES = 1000;

// Cache for directory ignore patterns
const dirPatternsCache = new Map<string[], string[]>();

/**
 * Get cached directory patterns
 */
function getDirectoryPatterns(ignorePatterns: string[]): string[] {
  if (!dirPatternsCache.has(ignorePatterns)) {
    dirPatternsCache.set(
      ignorePatterns,
      ignorePatterns.filter(pattern => {
        // Если паттерн заканчивается на '/', это директория
        if (pattern.endsWith('/')) return true;
        // Если паттерн начинается с '.' и не содержит '*', это скрытая директория/файл
        if (pattern.startsWith('.') && !pattern.includes('*')) return true;
        // Если паттерн не содержит '.' и '*', это обычная директория
        return !pattern.includes('.') && !pattern.includes('*');
      })
    );
  }
  return dirPatternsCache.get(ignorePatterns)!;
}

/**
 * Process a directory recursively with symlink and depth tracking
 */
async function shouldIgnoreDirectory(dirPath: string, ignorePatterns: string[]): Promise<boolean> {
  console.log('Checking directory:', dirPath);
  const dirName = path.basename(dirPath);
  console.log('Directory name:', dirName);

  const dirPatterns = getDirectoryPatterns(ignorePatterns);
  console.log('Directory patterns:', dirPatterns);

  // Проверяем точное совпадение имени директории и паттерны с '/'
  for (const pattern of dirPatterns) {
    const cleanPattern = pattern.replace(/\/$/, ''); // Убираем trailing slash
    if (cleanPattern === dirName) {
      console.log('Directory matched by exact pattern:', dirName);
      return true;
    }
  }

  // Разделяем паттерны на простые и regex
  const regexPatterns = ignorePatterns.filter(p => p.includes('*'));
  console.log('Regex patterns:', regexPatterns);

  // Проверяем regex паттерны
  if (regexPatterns.some(pattern => matchesPattern(dirName, pattern))) {
    console.log('Directory matched by regex pattern');
    return true;
  }

  console.log('Directory not ignored:', dirPath);
  return false;
}

// Cache for file patterns
const filePatternsCache = new Map<string[], string[]>();

/**
 * Get cached file patterns
 */
function getFilePatterns(ignorePatterns: string[]): string[] {
  if (!filePatternsCache.has(ignorePatterns)) {
    // Фильтруем только паттерны, которые могут быть файлами
    // (содержат точку или звездочку, но не заканчиваются на слеш)
    filePatternsCache.set(
      ignorePatterns,
      ignorePatterns.filter(
        pattern => (pattern.includes('.') || pattern.includes('*')) && !pattern.endsWith('/')
      )
    );
  }
  return filePatternsCache.get(ignorePatterns)!;
}

/**
 * Track total processed files and cache cleanup
 */
let totalFiles = 0;
let lastCacheCleanup = Date.now();
const CACHE_CLEANUP_INTERVAL = 30000; // 30 seconds

/**
 * Clean up expired cache entries and manage memory usage
 */
function cleanupCaches() {
  const now = Date.now();
  if (now - lastCacheCleanup < CACHE_CLEANUP_INTERVAL) {
    return;
  }

  // Очищаем устаревшие записи и обновляем общий размер кэша
  totalCacheSize = 0;
  for (const [key, value] of fileContentCache.entries()) {
    if (now - value.timestamp > FILE_CACHE_TTL) {
      fileContentCache.delete(key);
    } else {
      totalCacheSize += value.size;
    }
  }

  // Очищаем кэш информации о файлах
  for (const [key, value] of fileInfoCache.entries()) {
    if (now - value.timestamp > FILE_CACHE_TTL) {
      fileInfoCache.delete(key);
    }
  }

  // Очищаем кэш результатов игнорирования если он слишком большой
  if (ignoreResultCache.size > 5000) {
    const now = Date.now();
    const entriesToKeep = Array.from(ignoreResultCache.entries())
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .slice(0, 2500);
    ignoreResultCache.clear();
    for (const [key, { result }] of entriesToKeep) {
      ignoreResultCache.set(key, { result, timestamp: now });
    }
  }

  // Очищаем кэш регулярных выражений если он слишком большой
  if (regexCache.size > 500) {
    const now = Date.now();
    const entriesToKeep = Array.from(regexCache.entries())
      .sort(([, a], [, b]) => b.lastUsed - a.lastUsed)
      .slice(0, 250);
    regexCache.clear();
    for (const [key, { pattern }] of entriesToKeep) {
      regexCache.set(key, { pattern, lastUsed: now });
    }
  }

  lastCacheCleanup = now;

  // Принудительный запуск сборщика мусора при большом использовании памяти
  const used = process.memoryUsage();
  if (used.heapUsed > 200 * 1024 * 1024) {
    // 200MB
    global.gc && global.gc();
  }
}

/**
 * Generator function to process directory recursively
 */
async function* processDirectoryGenerator(
  dirPath: string,
  baseDir: string,
  ignorePatterns: string[],
  visitedPaths: Set<string> = new Set(),
  depth: number = 0
): AsyncGenerator<FileInfo> {
  console.log(`Processing directory (depth ${depth}):`, dirPath);

  if (depth > MAX_RECURSION_DEPTH || totalFiles >= MAX_FILES) {
    console.log('Max depth or files reached:', { depth, totalFiles });
    return;
  }

  if (!path.isAbsolute(dirPath)) {
    throw new Error(`Directory path must be absolute. Got: ${dirPath}`);
  }

  const shouldIgnore = await shouldIgnoreDirectory(dirPath, ignorePatterns);
  if (shouldIgnore) {
    console.log('Directory ignored:', dirPath);
    return;
  }

  try {
    const realPath = await fs.realpath(dirPath);
    if (visitedPaths.has(realPath)) {
      console.log('Directory already visited:', realPath);
      return;
    }
    visitedPaths.add(realPath);

    console.log('Reading directory:', dirPath);
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    console.log(`Found ${entries.length} entries`);

    const filePatterns = getFilePatterns(ignorePatterns);

    for (const entry of entries) {
      if (totalFiles >= MAX_FILES) break;

      const fullPath = path.join(dirPath, entry.name);
      console.log('Processing entry:', entry.name);

      try {
        if (entry.isSymbolicLink()) {
          console.log('Processing symlink:', fullPath);
          const targetPath = await fs.realpath(fullPath);
          const targetStats = await fs.stat(targetPath);

          if (targetStats.isDirectory()) {
            for await (const fileInfo of processDirectoryGenerator(
              targetPath,
              baseDir,
              ignorePatterns,
              visitedPaths,
              depth + 1
            )) {
              yield fileInfo;
            }
          } else if (targetStats.isFile() && !(await shouldIgnoreFile(targetPath, filePatterns))) {
            const fileInfo = await processFile(targetPath, baseDir);
            if (fileInfo) {
              yield fileInfo;
            }
          }
        } else if (entry.isDirectory()) {
          for await (const fileInfo of processDirectoryGenerator(
            fullPath,
            baseDir,
            ignorePatterns,
            visitedPaths,
            depth + 1
          )) {
            yield fileInfo;
          }
        } else if (entry.isFile() && !(await shouldIgnoreFile(fullPath, filePatterns))) {
          const fileInfo = await processFile(fullPath, baseDir);
          if (fileInfo) {
            yield fileInfo;
          }
        }
      } catch (error) {
        console.error('Error processing entry:', entry.name, error);
        continue;
      }
    }
  } catch (error) {
    console.error('Error processing directory:', dirPath, error);
  }
}

/**
 * Generator function to collect files incrementally
 */
export async function* collectFilesGenerator(
  input: string | string[],
  ignorePatterns: string[],
  baseDir: string = process.cwd()
): AsyncGenerator<FileInfo> {
  console.log('Starting collectFiles with:', { input, baseDir });
  console.log('Ignore patterns:', ignorePatterns);

  totalFiles = 0; // Reset counter
  cleanupCaches(); // Cleanup expired cache entries
  const inputs = Array.isArray(input) ? input : [input];
  const processedPaths = new Set<string>();

  // Validate all inputs are absolute paths
  for (const item of inputs) {
    if (!path.isAbsolute(item)) {
      throw new Error(`All input paths must be absolute. Got: ${item}`);
    }
  }

  for (const fullPath of inputs) {
    if (totalFiles >= MAX_FILES) break;

    try {
      if (processedPaths.has(fullPath)) continue;
      processedPaths.add(fullPath);

      console.log('Processing input path:', fullPath);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        console.log('Processing directory:', fullPath);
        for await (const fileInfo of processDirectoryGenerator(
          fullPath,
          baseDir,
          ignorePatterns,
          new Set()
        )) {
          totalFiles++;
          yield fileInfo;
        }
      } else if (stats.isFile()) {
        console.log('Processing file:', fullPath);
        const fileInfo = await processFile(fullPath, baseDir);
        if (fileInfo) {
          totalFiles++;
          yield fileInfo;
        }
      }
    } catch (error) {
      console.error('Error processing path:', fullPath, error);
      continue; // Skip failed inputs but continue processing
    }
  }
}

/**
 * Backward compatibility wrapper for collectFilesGenerator
 */
export async function collectFiles(
  input: string | string[],
  ignorePatterns: string[],
  baseDir: string = process.cwd()
): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  for await (const file of collectFilesGenerator(input, ignorePatterns, baseDir)) {
    files.push(file);
  }
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
