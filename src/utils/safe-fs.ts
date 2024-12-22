import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Sanitize file path for error messages by replacing sensitive parts
 */
function sanitizePath(filePath: string): string {
  const homeDir = os.homedir();
  const sanitized = filePath
    .replace(new RegExp('^' + homeDir), '~/') // Replace home directory with ~
    .replace(/\/Users\/[^/]+/, '~/') // Replace /Users/username with ~
    .replace(/\\Users\\[^\\]+/, '~\\') // Windows paths
    .split(path.sep)
    .map(part => {
      // Hide sensitive directory names
      if (['credentials', '.env', '.ssh', '.aws', '.config'].includes(part.toLowerCase())) {
        return '[protected]';
      }
      return part;
    })
    .join(path.sep);

  return sanitized;
}

class SafeFileError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly path: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SafeFileError';
  }
}

/**
 * List of trusted base directories
 */
const TRUSTED_DIRS = new Set([
  process.cwd(), // Current working directory
  os.tmpdir(), // Temporary directory
]);

/**
 * Add a trusted directory
 */
export function addTrustedDirectory(dir: string): void {
  TRUSTED_DIRS.add(path.resolve(dir));
}

/**
 * Check if path is within a trusted directory
 */
async function isInTrustedDirectory(filePath: string): Promise<boolean> {
  try {
    // Get real path to handle symlinks
    const realPath = await fs.realpath(filePath);
    const resolvedPath = path.resolve(realPath);

    // Check if path is under any trusted directory
    return Array.from(TRUSTED_DIRS).some(dir => resolvedPath.startsWith(dir));
  } catch (error) {
    // If file doesn't exist yet, check its parent directory
    const parentDir = path.dirname(filePath);
    return isInTrustedDirectory(parentDir);
  }
}

/**
 * Check for Unicode path traversal attempts
 */
function hasUnicodeTraversal(filePath: string): boolean {
  // Check for Unicode normalization tricks
  const normalized = filePath.normalize('NFKC');
  if (normalized !== filePath) {
    return true;
  }

  // Check for Unicode bidirectional characters
  const bidiChars = /[\u202A-\u202E\u2066-\u2069]/;
  return bidiChars.test(filePath);
}

/**
 * Validate file path for potential security issues
 */
async function validatePath(filePath: string): Promise<void> {
  if (!filePath) {
    throw new SafeFileError('File path cannot be empty', 'validate', filePath);
  }

  // Check for path traversal attempts
  const normalizedPath = path.normalize(filePath);
  if (normalizedPath.includes('..')) {
    throw new SafeFileError('Path traversal is not allowed', 'validate', sanitizePath(filePath));
  }

  // Check for Unicode path traversal
  if (hasUnicodeTraversal(filePath)) {
    throw new SafeFileError(
      'Path contains suspicious Unicode characters',
      'validate',
      sanitizePath(filePath)
    );
  }

  // Check for suspicious characters (including Unicode)
  const suspiciousChars = /[<>:"|?*\x00-\x1f\u0080-\u009F]/;
  if (suspiciousChars.test(filePath)) {
    throw new SafeFileError('Path contains invalid characters', 'validate', sanitizePath(filePath));
  }

  // Check if path is within trusted directories
  if (!(await isInTrustedDirectory(filePath))) {
    throw new SafeFileError(
      'Path is not within trusted directories',
      'validate',
      sanitizePath(filePath)
    );
  }
}

/**
 * Create error with sanitized path
 */
function createFileError(operation: string, filePath: string, error: Error): SafeFileError {
  const sanitized = sanitizePath(filePath);
  return new SafeFileError(
    `Failed to ${operation} file at ${sanitized}: ${error.message}`,
    operation,
    sanitized,
    error
  );
}

/**
 * Get canonical path resolving all symlinks
 */
async function getCanonicalPath(filePath: string, baseDir?: string): Promise<string> {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(baseDir || process.cwd(), filePath);

  try {
    // Resolve all symlinks and normalize path
    return await fs.realpath(absolutePath);
  } catch (error) {
    // If file doesn't exist, resolve parent directory
    const dir = path.dirname(absolutePath);
    const canonicalDir = await fs.realpath(dir);
    return path.join(canonicalDir, path.basename(absolutePath));
  }
}

/**
 * Read file from the filesystem with sanitized error messages
 */
export async function safeReadFile(filePath: string, baseDir?: string): Promise<string> {
  await validatePath(filePath);
  try {
    const canonicalPath = await getCanonicalPath(filePath, baseDir);
    return await fs.readFile(canonicalPath, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw createFileError('read', filePath, error);
    }
    throw error;
  }
}

/**
 * Write file to a directory with sanitized error messages
 */
export async function safeWriteFile(
  filePath: string,
  content: string,
  options: { append?: boolean; baseDir?: string } = {}
): Promise<void> {
  await validatePath(filePath);

  // Get canonical path
  const canonicalPath = await getCanonicalPath(filePath, options.baseDir);
  const dir = path.dirname(canonicalPath);

  try {
    // Create directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true });

    // Write or append to the file
    if (options.append) {
      await fs.appendFile(canonicalPath, content, 'utf-8');
    } else {
      await fs.writeFile(canonicalPath, content, 'utf-8');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw createFileError(options.append ? 'append to' : 'write', filePath, error);
    }
    throw error;
  }
}

/**
 * Get sanitized path for logging and error messages
 */
export function getSafePath(filePath: string): string {
  return sanitizePath(filePath);
}
