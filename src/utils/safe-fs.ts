import { promises as fs } from 'fs';
import path from 'path';

/**
 * Read file from the filesystem
 */
export async function safeReadFile(filePath: string): Promise<string> {
  try {
    const absolutePath = path.resolve(filePath);
    return await fs.readFile(absolutePath, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Write file to a directory
 */
export async function safeWriteFile(
  filePath: string,
  content: string,
  append: boolean = false
): Promise<void> {
  // Always use absolute paths
  const absolutePath = path.resolve(filePath);
  const dir = path.dirname(absolutePath);

  try {
    // Create directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true });

    // Write or append to the file
    if (append) {
      await fs.appendFile(absolutePath, content, 'utf-8');
    } else {
      await fs.writeFile(absolutePath, content, 'utf-8');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
    throw error;
  }
}
