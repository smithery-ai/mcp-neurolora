import fs from 'fs/promises';
import { Stats } from 'fs';
import path from 'path';
import { logger } from './logger.js';

interface CleanupConfig {
  maxAge?: number; // Максимальный возраст файлов в миллисекундах
  maxFiles?: number; // Максимальное количество файлов каждого типа
  dryRun?: boolean; // Режим проверки без удаления
}

interface FileInfo {
  path: string;
  type: string;
  stats: Stats;
}

const DEFAULT_CONFIG: CleanupConfig = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  maxFiles: 100,
  dryRun: false,
};

/**
 * Определяет тип файла по имени
 */
function getFileType(fileName: string): string {
  if (fileName.startsWith('PROMPT_ANALYZE_')) return 'analysis';
  if (fileName.startsWith('LAST_RESPONSE_')) return 'response';
  if (fileName.endsWith('.log')) return 'log';
  return 'other';
}

/**
 * Получает информацию о файлах в директории
 */
async function getDirectoryFiles(dirPath: string): Promise<FileInfo[]> {
  try {
    const files = await fs.readdir(dirPath);
    const fileInfos: FileInfo[] = [];

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          fileInfos.push({
            path: filePath,
            type: getFileType(file),
            stats,
          });
        }
      } catch (error) {
        logger.error(`Error getting file stats: ${file}`, error as Error, {
          component: 'Cleanup',
        });
      }
    }

    return fileInfos;
  } catch (error) {
    logger.error(`Error reading directory: ${dirPath}`, error as Error, {
      component: 'Cleanup',
    });
    return [];
  }
}

/**
 * Удаляет старые файлы
 */
async function removeOldFiles(
  files: FileInfo[],
  config: CleanupConfig,
  type: string
): Promise<number> {
  const now = Date.now();
  let removed = 0;

  // Сортируем файлы по времени изменения (новые в начале)
  const sortedFiles = files
    .filter(f => f.type === type)
    .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);

  // Удаляем файлы, превышающие лимит количества
  if (config.maxFiles && sortedFiles.length > config.maxFiles) {
    const filesToRemove = sortedFiles.slice(config.maxFiles);
    for (const file of filesToRemove) {
      if (!config.dryRun) {
        try {
          await fs.unlink(file.path);
          removed++;
          logger.debug(`Removed excess file: ${path.basename(file.path)}`, {
            component: 'Cleanup',
            type,
          });
        } catch (error) {
          logger.error(`Error removing file: ${file.path}`, error as Error, {
            component: 'Cleanup',
          });
        }
      } else {
        logger.info(`Would remove excess file: ${path.basename(file.path)}`, {
          component: 'Cleanup',
          type,
          dryRun: true,
        });
      }
    }
  }

  // Удаляем старые файлы
  if (config.maxAge) {
    for (const file of sortedFiles) {
      if (now - file.stats.mtimeMs > config.maxAge) {
        if (!config.dryRun) {
          try {
            await fs.unlink(file.path);
            removed++;
            logger.debug(`Removed old file: ${path.basename(file.path)}`, {
              component: 'Cleanup',
              type,
              age: Math.round((now - file.stats.mtimeMs) / (24 * 60 * 60 * 1000)),
            });
          } catch (error) {
            logger.error(`Error removing file: ${file.path}`, error as Error, {
              component: 'Cleanup',
            });
          }
        } else {
          logger.info(`Would remove old file: ${path.basename(file.path)}`, {
            component: 'Cleanup',
            type,
            age: Math.round((now - file.stats.mtimeMs) / (24 * 60 * 60 * 1000)),
            dryRun: true,
          });
        }
      }
    }
  }

  return removed;
}

/**
 * Очищает временные и выходные файлы
 */
export async function cleanup(
  neuroloraDir: string = '.neurolora',
  config: Partial<CleanupConfig> = {}
): Promise<{ [key: string]: number }> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const results: { [key: string]: number } = {};

  logger.info('Starting cleanup', {
    component: 'Cleanup',
    config: fullConfig,
    directory: neuroloraDir,
  });

  try {
    const files = await getDirectoryFiles(neuroloraDir);
    const fileTypes = ['analysis', 'response', 'log', 'other'];

    for (const type of fileTypes) {
      const removed = await removeOldFiles(files, fullConfig, type);
      results[type] = removed;
    }

    logger.info('Cleanup completed', {
      component: 'Cleanup',
      results,
      dryRun: fullConfig.dryRun,
    });

    return results;
  } catch (error) {
    logger.error('Cleanup failed', error as Error, { component: 'Cleanup' });
    throw error;
  }
}

/**
 * Очищает все файлы в директории
 */
export async function cleanupAll(neuroloraDir: string = '.neurolora'): Promise<void> {
  logger.info('Starting full cleanup', {
    component: 'Cleanup',
    directory: neuroloraDir,
  });

  try {
    const files = await getDirectoryFiles(neuroloraDir);
    for (const file of files) {
      try {
        await fs.unlink(file.path);
        logger.debug(`Removed file: ${path.basename(file.path)}`, {
          component: 'Cleanup',
          type: file.type,
        });
      } catch (error) {
        logger.error(`Error removing file: ${file.path}`, error as Error, {
          component: 'Cleanup',
        });
      }
    }

    logger.info('Full cleanup completed', {
      component: 'Cleanup',
      filesRemoved: files.length,
    });
  } catch (error) {
    logger.error('Full cleanup failed', error as Error, { component: 'Cleanup' });
    throw error;
  }
}

/**
 * Проверяет состояние директории
 */
export async function checkCleanupNeeded(
  neuroloraDir: string = '.neurolora',
  config: Partial<CleanupConfig> = {}
): Promise<boolean> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const files = await getDirectoryFiles(neuroloraDir);
    const now = Date.now();

    // Проверяем количество файлов каждого типа
    const fileTypes = ['analysis', 'response', 'log', 'other'];
    for (const type of fileTypes) {
      const typeFiles = files.filter(f => f.type === type);
      if (fullConfig.maxFiles && typeFiles.length > fullConfig.maxFiles) {
        return true;
      }
    }

    // Проверяем возраст файлов
    if (fullConfig.maxAge) {
      for (const file of files) {
        if (now - file.stats.mtimeMs > fullConfig.maxAge) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    logger.error('Cleanup check failed', error as Error, { component: 'Cleanup' });
    return false;
  }
}
