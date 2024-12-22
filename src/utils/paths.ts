import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

const APP_NAME = 'mcp-neurolora';
const DEV_SUFFIX = '-dev';

// Development mode flag
const isDev = process.env.NODE_ENV === 'development';

/**
 * Get standard paths for file storage following MCP conventions
 */
export function getAppPaths() {
  const appName = isDev ? `${APP_NAME}${DEV_SUFFIX}` : APP_NAME;
  // Base paths
  const homeDir = os.homedir();
  const tempDir = os.tmpdir();

  // OS-specific data directory
  let dataDir: string;
  switch (process.platform) {
    case 'darwin':
      // macOS: ~/Library/Application Support/mcp-neurolora(-dev)
      dataDir = path.join(homeDir, 'Library', 'Application Support', appName);
      break;
    case 'win32':
      // Windows: %APPDATA%/mcp-neurolora(-dev)
      dataDir = path.join(process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'), appName);
      break;
    default:
      // Linux/Unix: ~/.local/share/mcp-neurolora(-dev)
      dataDir = path.join(homeDir, '.local', 'share', appName);
  }

  // OS-specific log directory
  let logDir: string;
  switch (process.platform) {
    case 'darwin':
      // macOS: ~/Library/Logs/mcp-neurolora(-dev)
      logDir = path.join(homeDir, 'Library', 'Logs', appName);
      break;
    case 'win32':
      // Windows: %LOCALAPPDATA%/mcp-neurolora(-dev)/Logs
      logDir = path.join(
        process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local'),
        appName,
        'Logs'
      );
      break;
    default:
      // Linux/Unix: ~/.local/share/mcp-neurolora(-dev)/logs
      logDir = path.join(dataDir, 'logs');
  }

  // Temporary files directory (same for all OS)
  const tempFilesDir = path.join(tempDir, appName, 'prompts');

  // Analysis directories
  const promptsDir = path.join(dataDir, 'prompts');
  const analysisDir = path.join(dataDir, 'analysis');

  return {
    // Base directories
    homeDir, // User's home directory
    tempDir, // System temp directory
    dataDir, // App data directory
    logDir, // App logs directory

    // Analysis directories
    promptsDir, // Directory for code prompts
    analysisDir, // Directory for analysis results

    // Temporary files
    tempFilesDir,

    // Helper functions
    getPromptPath: (filename: string) => path.join(promptsDir, filename),
    getAnalysisPath: (filename: string) => path.join(analysisDir, filename),
    getLogPath: (filename: string) => path.join(logDir, filename),
  };
}

/**
 * Create development symlink for easier access
 */
export async function createDevSymlink() {
  if (!isDev) return;

  const paths = getAppPaths();
  const symlinkPath = '.neurolora';

  try {
    // Remove existing symlink if it exists
    try {
      await fs.unlink(symlinkPath);
    } catch (error) {
      // Ignore error if symlink doesn't exist
    }

    // Create new symlink
    await fs.symlink(paths.dataDir, symlinkPath, 'dir');
    console.log(
      `Created development symlink for easy access to analysis data: ${symlinkPath} -> ${paths.dataDir}`
    );
  } catch (error) {
    console.error(`Failed to create development symlink: ${(error as Error).message}`);
  }
}

/**
 * Ensure all required directories exist and setup development environment
 */
export async function ensureAppDirectories() {
  const paths = getAppPaths();
  const dirsToCreate = [paths.tempFilesDir, paths.promptsDir, paths.analysisDir, paths.logDir];

  for (const dir of dirsToCreate) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dir}: ${(error as Error).message}`);
    }
  }

  // Create development symlink
  if (isDev) {
    await createDevSymlink();
  }
}
