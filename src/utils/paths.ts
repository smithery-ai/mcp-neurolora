import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

const APP_NAME = 'aindreyway-mcp-neurolora';

/**
 * Get standard paths for file storage following OS conventions
 */
export function getAppPaths() {
  // Base paths
  const homeDir = os.homedir();
  const tempDir = os.tmpdir();

  // OS-specific data directory
  let dataDir: string;
  switch (process.platform) {
    case 'darwin':
      // macOS: ~/Library/Application Support/aindreyway-mcp-neurolora
      dataDir = path.join(homeDir, 'Library', 'Application Support', APP_NAME);
      break;
    case 'win32':
      // Windows: %APPDATA%/aindreyway-mcp-neurolora
      dataDir = path.join(
        process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'),
        APP_NAME
      );
      break;
    default:
      // Linux/Unix: ~/.local/share/aindreyway-mcp-neurolora
      dataDir = path.join(homeDir, '.local', 'share', APP_NAME);
  }

  // OS-specific log directory
  let logDir: string;
  switch (process.platform) {
    case 'darwin':
      // macOS: ~/Library/Logs/aindreyway-mcp-neurolora
      logDir = path.join(homeDir, 'Library', 'Logs', APP_NAME);
      break;
    case 'win32':
      // Windows: %LOCALAPPDATA%/aindreyway-mcp-neurolora/Logs
      logDir = path.join(
        process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local'),
        APP_NAME,
        'Logs'
      );
      break;
    default:
      // Linux/Unix: ~/.local/share/aindreyway-mcp-neurolora/logs
      logDir = path.join(dataDir, 'logs');
  }

  // Temporary files directory (same for all OS)
  const tempFilesDir = path.join(tempDir, APP_NAME, 'prompts');

  // Analysis results directory (in data directory)
  const analysisDir = path.join(dataDir, 'analysis');

  return {
    // Base directories
    homeDir, // User's home directory
    tempDir, // System temp directory
    dataDir, // App data directory
    logDir, // App logs directory

    // Specific directories
    tempFilesDir, // Temporary files (PROMPT_FULL_CODE_*.md)
    analysisDir, // Analysis results (LAST_RESPONSE_*)

    // Helper functions
    getPromptPath: (filename: string) => path.join(tempFilesDir, filename),
    getAnalysisPath: (filename: string) => path.join(analysisDir, filename),
    getLogPath: (filename: string) => path.join(logDir, filename),
  };
}

/**
 * Ensure all required directories exist
 */
export async function ensureAppDirectories() {
  const paths = getAppPaths();
  const dirsToCreate = [paths.tempFilesDir, paths.analysisDir, paths.logDir];

  for (const dir of dirsToCreate) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dir}: ${(error as Error).message}`);
    }
  }
}
