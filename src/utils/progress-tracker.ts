import { clearProgress, showProgress } from './progress.js';
import { logger } from './logger.js';

interface ProgressOptions {
  prefix?: string;
  width?: number;
  silent?: boolean;
}

/**
 * Progress tracker for long-running operations
 */
export class ProgressTracker {
  private interval: NodeJS.Timeout | null = null;
  private startTime: number;
  private stopped = false;
  private currentStep = 0;

  constructor(
    private readonly totalSteps: number,
    private readonly options: ProgressOptions = {}
  ) {
    this.startTime = Date.now();
    logger.debug('Progress tracker initialized', {
      component: 'ProgressTracker',
      totalSteps,
      options,
    });
  }

  /**
   * Start tracking progress
   */
  start(): void {
    if (this.interval) return;

    logger.debug('Starting progress tracking', {
      component: 'ProgressTracker',
      prefix: this.options.prefix,
    });

    this.interval = setInterval(async () => {
      if (this.stopped) return;

      const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      this.currentStep = Math.min(
        this.totalSteps,
        Math.floor((elapsedSeconds / 120) * this.totalSteps)
      );
      const percentage = Math.round((this.currentStep / this.totalSteps) * 100);

      await showProgress(percentage, {
        width: this.options.width || 20,
        prefix: this.options.prefix || '[Progress]',
        silent: this.options.silent !== false, // По умолчанию true
      });
    }, 1000);
  }

  /**
   * Update progress manually
   */
  async update(step: number): Promise<void> {
    if (this.stopped) return;

    this.currentStep = Math.min(Math.max(0, step), this.totalSteps);
    const percentage = Math.round((this.currentStep / this.totalSteps) * 100);

    logger.debug('Progress updated', {
      component: 'ProgressTracker',
      step: this.currentStep,
      percentage,
    });

    await showProgress(percentage, {
      width: this.options.width || 20,
      prefix: this.options.prefix || '[Progress]',
      silent: this.options.silent !== false,
    });
  }

  /**
   * Stop tracking progress and clear the display
   */
  async stop(message?: string): Promise<void> {
    this.stopped = true;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    logger.info('Progress tracking stopped', {
      component: 'ProgressTracker',
      finalStep: this.currentStep,
      totalSteps: this.totalSteps,
      message,
    });

    await clearProgress(message || '', this.options.silent !== false);
  }

  /**
   * Get current progress percentage
   */
  getProgress(): number {
    return Math.round((this.currentStep / this.totalSteps) * 100);
  }
}
