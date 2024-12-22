import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export class PidManager {
  private readonly pidFile: string;

  constructor(baseDir: string) {
    // Store PID file in the same directory as the running script
    this.pidFile = path.join(baseDir, '.neurolora.pid');
  }

  /**
   * Write current process PID to file
   */
  async writePid(): Promise<void> {
    try {
      const pid = process.pid;
      await fs.writeFile(this.pidFile, pid.toString(), 'utf-8');
    } catch (error) {
      console.error('[PID Manager] Failed to write PID file:', error);
    }
  }

  /**
   * Read stored PID from file
   */
  async readPid(): Promise<number | null> {
    try {
      const pidStr = await fs.readFile(this.pidFile, 'utf-8');
      return parseInt(pidStr, 10);
    } catch (error) {
      // File may not exist yet
      return null;
    }
  }

  /**
   * Remove PID file
   */
  async cleanup(): Promise<void> {
    try {
      await fs.unlink(this.pidFile);
    } catch (error) {
      // Ignore errors if file doesn't exist
    }
  }

  /**
   * Check if a process with given PID is running and belongs to this server
   */
  async isServerProcess(pid: number): Promise<boolean> {
    try {
      // Check if process exists
      process.kill(pid, 0);

      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
        const cmd = `wmic process where ProcessId=${pid} get CommandLine`;
        const output = execSync(cmd).toString();
        return output.includes('build/index.js');
      } else {
        const { execSync } = require('child_process');
        const cmd = `ps -p ${pid} -o command=`;
        const output = execSync(cmd).toString();
        return output.includes('build/index.js');
      }
    } catch (error) {
      return false; // Process doesn't exist or we don't have permission
    }
  }
}
