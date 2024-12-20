import { promises as fs } from 'fs';
import path from 'path';

/**
 * Write file to a directory
 */
export async function safeWriteFile(filePath: string, content: string): Promise<void> {
  // Always use absolute paths
  const absolutePath = path.resolve(filePath);
  const dir = path.dirname(absolutePath);

  try {
    // Create directory if it doesn't exist
    await fs.mkdir(dir, { recursive: true });

    // Write the file
    await fs.writeFile(absolutePath, content, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
    throw error;
  }
}
