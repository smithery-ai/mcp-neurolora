import { promises as fs } from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { getAppPaths } from './paths.js';

// Possible locations for .neuroloraignore file
const IGNORE_FILE_NAME = '.neuroloraignore';

/**
 * Parse ignore file content into patterns
 */
function parseIgnoreContent(content: string): string[] {
  return (
    content
      .split('\n')
      .map(line => line.trim())
      // Remove empty lines and comments
      .filter(line => line && !line.startsWith('#'))
      // Normalize patterns
      .map(pattern => pattern.replace(/\/$/, '')) // Remove trailing slashes
  );
}

/**
 * Find .neuroloraignore file in possible locations
 */
async function findIgnoreFile(projectRoot: string): Promise<string | null> {
  // Get system paths
  const paths = getAppPaths();

  // Check possible locations in order:
  // 1. Custom path from config if set
  // 2. Project root
  // 3. System data directory
  const possiblePaths = [
    config.fs.ignorePath && path.resolve(config.fs.ignorePath),
    path.join(projectRoot, IGNORE_FILE_NAME),
    path.join(paths.dataDir, IGNORE_FILE_NAME),
  ].filter(Boolean) as string[];

  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      return p;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Read ignore patterns from .neuroloraignore file
 * If file doesn't exist, creates it from template in project root
 */
export async function getIgnorePatterns(projectRoot: string): Promise<string[]> {
  // Try to find existing .neuroloraignore
  const existingPath = await findIgnoreFile(projectRoot);
  if (existingPath) {
    const content = await fs.readFile(existingPath, 'utf-8');
    return parseIgnoreContent(content);
  }

  // If not found, create in project root from template
  const newIgnorePath = path.join(projectRoot, IGNORE_FILE_NAME);
  try {
    const templatePath = path.join(process.cwd(), 'build', 'templates', 'neuroloraignore.template');
    console.log('Creating .neuroloraignore from template at:', newIgnorePath);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    await fs.writeFile(newIgnorePath, templateContent, 'utf-8');
    return parseIgnoreContent(templateContent);
  } catch (error) {
    console.warn('Failed to create .neuroloraignore from template, using default patterns');
    return config.fs.defaultIgnorePatterns;
  }
}
