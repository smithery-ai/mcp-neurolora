import path from 'path';
import fs from 'fs';

// Базовая директория проекта
const BASE_DIR = process.cwd();

// Список разрешенных директорий
const ALLOWED_DIRECTORIES = [
  // Текущая директория проекта
  BASE_DIR,
  // Директория для выходных файлов
  path.join(BASE_DIR, '.neurolora'),
  // Временная директория внутри проекта
  path.join(BASE_DIR, 'tmp'),
];

// Создаем временную директорию, если её нет
if (!fs.existsSync(path.join(BASE_DIR, 'tmp'))) {
  fs.mkdirSync(path.join(BASE_DIR, 'tmp'), { recursive: true });
}

/**
 * Проверяет, является ли путь валидным
 */
function isValidPath(filePath: string | null | undefined): boolean {
  if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
    return false;
  }

  // Проверяем на недопустимые символы
  const invalidChars = /[<>:"|?*\x00-\x1f]/g;
  if (invalidChars.test(filePath)) {
    return false;
  }

  // Проверяем на URL-строки
  if (filePath.includes('?') || filePath.includes('#')) {
    return false;
  }

  return true;
}

/**
 * Проверяет, находится ли путь в разрешенной директории
 */
export function isPathAllowed(filePath: string | null | undefined): boolean {
  try {
    // Проверяем базовую валидность пути
    if (!isValidPath(filePath)) {
      return false;
    }

    // Нормализуем путь
    const normalizedPath = path.resolve(filePath as string);

    // Проверяем на выход за пределы базовой директории
    const relativePath = path.relative(BASE_DIR, normalizedPath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      console.warn(`[Security] Path traversal attempt detected: ${filePath}`);
      return false;
    }

    // Проверяем, что путь находится в одной из разрешенных директорий
    const isAllowed = ALLOWED_DIRECTORIES.some(dir => {
      const normalizedDir = path.resolve(dir);
      return normalizedPath.startsWith(normalizedDir);
    });

    // Логируем попытки доступа к неразрешенным путям
    if (!isAllowed) {
      console.warn(`[Security] Attempted access to restricted path: ${filePath}`);
    }

    return isAllowed;
  } catch (error) {
    // В случае любых ошибок при обработке пути считаем его недопустимым
    console.error(`[Security] Error validating path: ${error}`);
    return false;
  }
}

/**
 * Проверяет и нормализует путь
 * @throws {Error} если путь не разрешен
 */
export function validateAndNormalizePath(filePath: string | null | undefined): string {
  if (!isValidPath(filePath)) {
    throw new Error(`Invalid path format: ${filePath}`);
  }

  const normalizedPath = path.resolve(filePath as string);
  if (!isPathAllowed(normalizedPath)) {
    throw new Error(`Access to path '${filePath}' is not allowed for security reasons`);
  }
  return normalizedPath;
}
