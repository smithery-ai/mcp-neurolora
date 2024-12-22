import os from 'os';
import path from 'path';
import { Worker } from 'worker_threads';
import { logger } from './logger.js';
import { config } from '../config/index.js';

const DEFAULT_TIMEOUT = 5000; // 5 seconds

interface Task {
  pattern: string;
  input: string;
  resolve: (value: boolean) => void;
  reject: (error: Error) => void;
  timeoutId?: NodeJS.Timeout;
  startTime: number;
}

interface WorkerPoolConfig {
  maxWorkers: number;
  timeout: number;
}

/**
 * Pool of workers for parallel regex testing
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Task[] = [];
  private readonly maxWorkers: number;
  private readonly workerPath: string;
  private activeWorkers = 0;

  private readonly config: WorkerPoolConfig;

  constructor(workerPath: string, config?: Partial<WorkerPoolConfig>) {
    this.config = {
      maxWorkers: config?.maxWorkers || os.cpus().length,
      timeout: config?.timeout || DEFAULT_TIMEOUT,
    };
    this.maxWorkers = this.config.maxWorkers;
    this.workerPath = workerPath;

    logger.info('Initializing worker pool', {
      maxWorkers: this.config.maxWorkers,
      timeout: this.config.timeout,
      workerPath,
      component: 'WorkerPool',
    });
  }

  /**
   * Initialize worker pool
   */
  private initializeWorker(): Worker {
    const worker = new Worker(this.workerPath);

    worker.on('message', (response: { result?: boolean; error?: string }) => {
      const task = this.taskQueue[0];
      if (!task) return;

      // Очищаем таймаут
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }

      const duration = Date.now() - task.startTime;
      if ('error' in response) {
        logger.error('Worker task failed', new Error(response.error), {
          pattern: task.pattern,
          duration,
          component: 'WorkerPool',
        });
        task.reject(new Error(response.error));
      } else {
        logger.debug('Worker task completed', {
          pattern: task.pattern,
          duration,
          result: response.result,
          component: 'WorkerPool',
        });
        task.resolve(response.result || false);
      }

      this.taskQueue.shift();
      this.activeWorkers--;

      if (this.taskQueue.length > 0) {
        this.processNextTask();
      }
    });

    worker.on('error', error => {
      logger.error('Worker error', error, { component: 'WorkerPool' });

      const task = this.taskQueue[0];
      if (task) {
        if (task.timeoutId) {
          clearTimeout(task.timeoutId);
        }
        task.reject(error);
        this.taskQueue.shift();
      }

      this.activeWorkers--;

      // Replace failed worker
      const index = this.workers.indexOf(worker);
      if (index !== -1) {
        this.workers[index] = this.initializeWorker();
      }

      if (this.taskQueue.length > 0) {
        this.processNextTask();
      }
    });

    return worker;
  }

  /**
   * Process next task from queue
   */
  private processNextTask(): void {
    logger.debug('Processing next task', {
      queueLength: this.taskQueue.length,
      activeWorkers: this.activeWorkers,
      totalWorkers: this.workers.length,
      component: 'WorkerPool',
    });

    if (this.taskQueue.length === 0) {
      logger.debug('No tasks in queue', { component: 'WorkerPool' });
      return;
    }

    if (this.workers.length < this.maxWorkers) {
      logger.debug('Creating new worker', { component: 'WorkerPool' });
      this.workers.push(this.initializeWorker());
    }

    // Распределяем задачи по свободным воркерам
    for (const worker of this.workers) {
      if (this.taskQueue.length === 0) {
        logger.debug('Queue empty, stopping distribution', { component: 'WorkerPool' });
        break;
      }

      // Проверяем, не занят ли воркер
      if (this.activeWorkers < this.workers.length) {
        const task = this.taskQueue.shift();
        if (task) {
          logger.debug('Assigning task to worker', {
            pattern: task.pattern,
            component: 'WorkerPool',
          });

          // Устанавливаем таймаут для задачи
          task.timeoutId = setTimeout(() => {
            logger.warn('Worker task timeout', {
              pattern: task.pattern,
              timeout: this.config.timeout,
              component: 'WorkerPool',
            });

            // Удаляем задачу из очереди
            const index = this.taskQueue.indexOf(task);
            if (index !== -1) {
              this.taskQueue.splice(index, 1);
            }

            task.reject(new Error(`Task timeout after ${this.config.timeout}ms`));
            this.activeWorkers--;

            // Пробуем обработать следующую задачу
            if (this.taskQueue.length > 0) {
              this.processNextTask();
            }
          }, this.config.timeout);

          task.startTime = Date.now();
          this.activeWorkers++;
          worker.postMessage([task.pattern, task.input]);
        }
      } else {
        logger.debug('All workers busy', { component: 'WorkerPool' });
        break;
      }
    }

    logger.debug('Task processing complete', {
      remainingTasks: this.taskQueue.length,
      activeWorkers: this.activeWorkers,
      component: 'WorkerPool',
    });
  }

  /**
   * Execute regex test in worker pool
   */
  async execRegexTest(pattern: string, input: string): Promise<boolean> {
    logger.debug('Adding regex test task', {
      pattern,
      queueLength: this.taskQueue.length,
      activeWorkers: this.activeWorkers,
      component: 'WorkerPool',
    });

    return new Promise((resolve, reject) => {
      // Add task to queue
      this.taskQueue.push({
        pattern,
        input,
        resolve: result => {
          logger.debug('Task completed', {
            pattern,
            result,
            component: 'WorkerPool',
          });
          resolve(result);
        },
        reject: error => {
          logger.error('Task failed', error, {
            pattern,
            component: 'WorkerPool',
          });
          reject(error);
        },
        startTime: Date.now(),
      });

      // Process task if workers available
      this.processNextTask();
    });
  }

  /**
   * Terminate all workers
   */
  async terminate(): Promise<void> {
    logger.info('Terminating worker pool', {
      totalWorkers: this.workers.length,
      activeWorkers: this.activeWorkers,
      remainingTasks: this.taskQueue.length,
      component: 'WorkerPool',
    });

    // Очищаем все таймауты
    for (const task of this.taskQueue) {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
      }
    }
    await Promise.all(this.workers.map(worker => worker.terminate()));
    this.workers = [];
    this.activeWorkers = 0;
    logger.info('Worker pool terminated', { component: 'WorkerPool' });
  }
}

// Create singleton instance
const workerPool = new WorkerPool(path.join(process.cwd(), 'build', 'utils', 'regex-worker.js'));

export default workerPool;
