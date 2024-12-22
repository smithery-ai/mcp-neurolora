import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { safeWriteFile, safeReadFile } from './safe-fs.js';

interface AnalysisResult {
  id: string;
  timestamp: number;
  inputPath: string;
  outputPath: string;
  status: 'completed' | 'failed';
  error?: string;
  metadata: {
    tokenCount: number;
    issueCount: number;
    duration: number;
  };
}

interface AnalysisIndex {
  results: AnalysisResult[];
  lastCleanup: number;
}

/**
 * Store for analysis results with indexing and cleanup
 */
export class AnalysisStore {
  private readonly storageDir: string;
  private readonly indexPath: string;
  private index: AnalysisIndex;

  constructor(baseDir: string) {
    this.storageDir = path.join(baseDir, '.analysis-store');
    this.indexPath = path.join(this.storageDir, 'index.json');
    this.index = { results: [], lastCleanup: Date.now() };
  }

  /**
   * Initialize store
   */
  async init(): Promise<void> {
    // Create storage directory
    await fs.mkdir(this.storageDir, { recursive: true });

    // Load index if exists
    try {
      const indexContent = await safeReadFile(this.indexPath);
      this.index = JSON.parse(indexContent);
    } catch (error) {
      // Create new index if doesn't exist
      await this.saveIndex();
    }

    // Run cleanup if needed
    await this.cleanupIfNeeded();
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    await safeWriteFile(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  /**
   * Create new analysis result
   */
  async createResult(input: {
    inputPath: string;
    outputPath: string;
    metadata: AnalysisResult['metadata'];
  }): Promise<AnalysisResult> {
    const result: AnalysisResult = {
      id: uuidv4(),
      timestamp: Date.now(),
      inputPath: input.inputPath,
      outputPath: input.outputPath,
      status: 'completed',
      metadata: input.metadata,
    };

    this.index.results.push(result);
    await this.saveIndex();

    return result;
  }

  /**
   * Update analysis result status
   */
  async updateStatus(id: string, status: 'completed' | 'failed', error?: string): Promise<void> {
    const result = this.index.results.find(r => r.id === id);
    if (!result) {
      throw new Error(`Analysis result not found: ${id}`);
    }

    result.status = status;
    if (error) {
      result.error = error;
    }

    await this.saveIndex();
  }

  /**
   * Get analysis result by ID
   */
  async getResult(id: string): Promise<AnalysisResult | null> {
    return this.index.results.find(r => r.id === id) || null;
  }

  /**
   * Get analysis results by input path
   */
  async getResultsByInput(inputPath: string): Promise<AnalysisResult[]> {
    return this.index.results.filter(r => r.inputPath === inputPath);
  }

  /**
   * Get latest analysis results
   */
  async getLatestResults(limit = 10): Promise<AnalysisResult[]> {
    return [...this.index.results].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * Clean up old results
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Remove old results
    this.index.results = this.index.results.filter(result => {
      return now - result.timestamp < maxAge;
    });

    this.index.lastCleanup = now;
    await this.saveIndex();
  }

  /**
   * Run cleanup if needed (once per day)
   */
  private async cleanupIfNeeded(): Promise<void> {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    if (now - this.index.lastCleanup > dayInMs) {
      await this.cleanup();
    }
  }

  /**
   * Get analysis statistics
   */
  async getStats(): Promise<{
    totalAnalyses: number;
    failedAnalyses: number;
    averageTokenCount: number;
    averageIssueCount: number;
    averageDuration: number;
  }> {
    const completed = this.index.results.filter(r => r.status === 'completed');
    const failed = this.index.results.filter(r => r.status === 'failed');

    const avgTokens =
      completed.reduce((sum, r) => sum + r.metadata.tokenCount, 0) / completed.length;
    const avgIssues =
      completed.reduce((sum, r) => sum + r.metadata.issueCount, 0) / completed.length;
    const avgDuration =
      completed.reduce((sum, r) => sum + r.metadata.duration, 0) / completed.length;

    return {
      totalAnalyses: this.index.results.length,
      failedAnalyses: failed.length,
      averageTokenCount: Math.round(avgTokens),
      averageIssueCount: Math.round(avgIssues * 10) / 10,
      averageDuration: Math.round(avgDuration),
    };
  }
}

// Create singleton instance
const analysisStore = new AnalysisStore(process.cwd());
export default analysisStore;
