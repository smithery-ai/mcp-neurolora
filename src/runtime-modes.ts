import path from 'path';
import os from 'os';

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  storagePath: string;
  serverName: string;
  logDir: string;
}

/**
 * Get platform-specific data directory
 * Following XDG Base Directory Specification for Linux/macOS
 * and standard app data locations for Windows
 */
function getDataDir(): string {
  switch (process.platform) {
    case 'darwin':
      // macOS: ~/Library/Application Support
      return path.join(os.homedir(), 'Library', 'Application Support', 'mcp-neurolora');
    case 'win32':
      // Windows: %APPDATA%
      return path.join(
        process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
        'mcp-neurolora'
      );
    default:
      // Linux/Unix: $XDG_DATA_HOME or ~/.local/share
      const xdgDataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
      return path.join(xdgDataHome, 'mcp-neurolora');
  }
}

/**
 * Get platform-specific log directory
 */
function getLogDir(): string {
  switch (process.platform) {
    case 'darwin':
      // macOS: ~/Library/Logs
      return path.join(os.homedir(), 'Library', 'Logs', 'mcp-neurolora');
    case 'win32':
      // Windows: %LOCALAPPDATA%/Logs
      return path.join(
        process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
        'mcp-neurolora',
        'Logs'
      );
    default:
      // Linux/Unix: $XDG_STATE_HOME/log or ~/.local/state/log
      const xdgStateHome = process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state');
      return path.join(xdgStateHome, 'mcp-neurolora', 'log');
  }
}

/**
 * Get runtime configuration
 * The storage path and server name are determined by the environment:
 * - Development: Uses XDG_DATA_HOME/mcp-neurolora-dev
 * - Production: Uses platform-specific app data directory
 */
export function getRuntimeConfig(): RuntimeConfig {
  const isDev = process.env.NODE_ENV === 'development';
  const baseDir = getDataDir();
  const suffix = isDev ? '-dev' : '';

  return {
    serverName: 'aindreyway-mcp-neurolora',
    storagePath: `${baseDir}${suffix}`,
    logDir: `${getLogDir()}${suffix}`,
  };
}
