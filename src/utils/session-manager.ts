import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

interface Session {
  id: string;
  timestamp: number;
  tool: string;
  status: 'running' | 'completed' | 'failed';
  inputPath?: string;
  outputPath?: string;
}

/**
 * Manages analysis sessions to prevent collisions
 */
export class SessionManager {
  private readonly sessionsDir: string;
  private readonly sessionsFile: string;

  constructor(baseDir: string) {
    this.sessionsDir = path.join(baseDir, '.sessions');
    this.sessionsFile = path.join(this.sessionsDir, 'sessions.json');
  }

  /**
   * Initialize sessions directory
   */
  private async init(): Promise<void> {
    try {
      await fs.mkdir(this.sessionsDir, { recursive: true });

      // Create sessions file if it doesn't exist
      try {
        await fs.access(this.sessionsFile);
      } catch {
        await fs.writeFile(this.sessionsFile, '[]', 'utf-8');
      }
    } catch (error) {
      throw new Error(`Failed to initialize sessions: ${error}`);
    }
  }

  /**
   * Read all sessions
   */
  private async readSessions(): Promise<Session[]> {
    try {
      const data = await fs.readFile(this.sessionsFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Write sessions to file
   */
  private async writeSessions(sessions: Session[]): Promise<void> {
    await fs.writeFile(this.sessionsFile, JSON.stringify(sessions, null, 2), 'utf-8');
  }

  /**
   * Generate unique output path for a session
   */
  private getSessionOutputPath(sessionId: string, originalPath: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const base = path.basename(originalPath, ext);
    return path.join(dir, `${base}_${sessionId}${ext}`);
  }

  /**
   * Create new analysis session
   */
  async createSession(tool: string, inputPath?: string): Promise<Session> {
    await this.init();

    const session: Session = {
      id: uuidv4(),
      timestamp: Date.now(),
      tool,
      status: 'running',
      inputPath,
    };

    const sessions = await this.readSessions();
    sessions.push(session);
    await this.writeSessions(sessions);

    return session;
  }

  /**
   * Get unique output path for analysis results
   */
  getOutputPath(session: Session, defaultPath: string): string {
    return this.getSessionOutputPath(session.id, defaultPath);
  }

  /**
   * Update session status
   */
  async updateSession(
    sessionId: string,
    updates: Partial<Omit<Session, 'id' | 'timestamp'>>
  ): Promise<void> {
    const sessions = await this.readSessions();
    const index = sessions.findIndex(s => s.id === sessionId);

    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      await this.writeSessions(sessions);
    }
  }

  /**
   * Clean up old sessions (older than 24 hours)
   */
  async cleanup(): Promise<void> {
    const sessions = await this.readSessions();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const activeSessions = sessions.filter(session => {
      return session.timestamp > oneDayAgo || session.status === 'running';
    });

    await this.writeSessions(activeSessions);
  }

  /**
   * Get all active sessions
   */
  async getActiveSessions(): Promise<Session[]> {
    const sessions = await this.readSessions();
    return sessions.filter(s => s.status === 'running');
  }
}
