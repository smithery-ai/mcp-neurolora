import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * List of allowed directories for file operations
 */
const ALLOWED_DIRECTORIES = [
  // User's home directory
  os.homedir(),
  // System temp directory
  os.tmpdir(),
  // Current working directory
  process.cwd(),
];

/**
 * Check if a path is within allowed directories
 */
function isPathAllowed(filePath: string): boolean {
  const resolvedPath = path.resolve(filePath);
  return ALLOWED_DIRECTORIES.some(dir => resolvedPath.startsWith(dir));
}

/**
 * Safely write a file to an allowed directory
 */
export async function safeWriteFile(filePath: string, content: string): Promise<void> {
  if (!isPathAllowed(filePath)) {
    throw new Error(
      `Access denied: ${filePath} is not in allowed directories. Allowed directories are: ${ALLOWED_DIRECTORIES.join(
        ', '
      )}`
    );
  }

  const dir = path.dirname(filePath);

  try {
    // Create directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true });

    // Write the file
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get list of allowed directories
 */
export function getAllowedDirectories(): string[] {
  return [...ALLOWED_DIRECTORIES];
}
