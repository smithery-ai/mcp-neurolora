import chalk from 'chalk';
import path from 'path';
import { getRuntimeConfig } from '../runtime-modes.js';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

interface LogConfig {
  level: LogLevel;
  maxFileSize?: number; // В байтах
  maxFiles?: number;
  logDir?: string;
}

interface LogContext {
  component?: string;
  operation?: string;
  [key: string]: any;
}

export class Logger {
  private static instance: Logger;
  private config: LogConfig;
  private logStream?: NodeJS.WritableStream;
  private currentLogFile?: string;
  private currentFileSize: number = 0;

  private constructor() {
    const runtime = getRuntimeConfig();
    this.config = {
      level: this.getLogLevelFromEnv(),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      logDir: process.env.LOG_DIR || runtime.logDir,
    };

    this.setupLogRotation();
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      case 'NONE':
        return LogLevel.NONE;
      default:
        return LogLevel.INFO;
    }
  }

  private async setupLogRotation() {
    // В тестовом окружении не создаем файлы логов
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const fs = await import('fs/promises');
    const { createWriteStream } = await import('fs');

    try {
      // Создаем директорию для логов если её нет
      await fs.mkdir(this.config.logDir!, { recursive: true });

      // Создаем новый файл лога с текущей датой
      const now = new Date();
      this.currentLogFile = path.join(
        this.config.logDir!,
        `neurolora-${now.toISOString().split('T')[0]}.log`
      );

      // Проверяем существующие логи и удаляем старые если превышен лимит
      const files = await fs.readdir(this.config.logDir!);
      const logFiles = files
        .filter(f => f.startsWith('neurolora-') && f.endsWith('.log'))
        .sort()
        .reverse();

      if (logFiles.length >= this.config.maxFiles!) {
        for (const file of logFiles.slice(this.config.maxFiles!)) {
          await fs.unlink(path.join(this.config.logDir!, file));
        }
      }

      // Создаем поток для записи
      this.logStream = createWriteStream(this.currentLogFile, { flags: 'a' });
    } catch (error) {
      console.error('Failed to setup log rotation:', error);
    }
  }

  private async rotateLogIfNeeded(message: string) {
    if (!this.logStream || !this.currentLogFile) return;

    this.currentFileSize += Buffer.byteLength(message);
    if (this.currentFileSize >= this.config.maxFileSize!) {
      this.logStream.end();
      await this.setupLogRotation();
      this.currentFileSize = 0;
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel) {
    this.config.level = level;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();

    if (!context) {
      return `${timestamp} ${level} ${message}`;
    }

    const entries = Object.entries(context)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `${key}=${JSON.stringify(value)}`;
        }
        return `${key}=${value}`;
      });

    const contextStr = entries.length ? ` [${entries.join(', ')}]` : '';

    return `${timestamp} ${level}${contextStr} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private async log(level: LogLevel, message: string, error?: Error, context?: LogContext) {
    if (!this.shouldLog(level)) return;

    const errorDetails = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
    const formattedMessage = this.formatMessage(
      LogLevel[level],
      `${message}${errorDetails}`,
      context
    );

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(chalk.gray(formattedMessage));
        break;
      case LogLevel.INFO:
        console.info(chalk.blue(formattedMessage));
        break;
      case LogLevel.WARN:
        console.warn(chalk.yellow(formattedMessage));
        break;
      case LogLevel.ERROR:
        console.error(chalk.red(formattedMessage));
        break;
    }

    await this.rotateLogIfNeeded(formattedMessage + '\n');
    this.logStream?.write(formattedMessage + '\n');
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, undefined, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, undefined, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, undefined, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, message, error, context);
  }

  // Методы для отслеживания файловых операций
  fileOperation(operation: string, path: string, context?: LogContext) {
    this.debug(`File operation: ${operation}`, {
      ...context,
      operation,
      path,
      component: 'FileSystem',
    });
  }

  fileError(operation: string, path: string, error: Error, context?: LogContext) {
    this.error(`File operation failed: ${operation}`, error, {
      ...context,
      operation,
      path,
      component: 'FileSystem',
    });
  }

  async close() {
    if (this.logStream) {
      await new Promise<void>(resolve => {
        this.logStream!.end(() => resolve());
      });
    }
  }

  // Специальные методы для отслеживания прогресса анализа
  startAnalysis(context?: LogContext) {
    this.info('Starting code analysis', { ...context, phase: 'start' });
  }

  analysisProgress(progress: number, context?: LogContext) {
    this.debug(`Analysis progress: ${progress}%`, { ...context, phase: 'progress' });
  }

  analysisComplete(context?: LogContext) {
    this.info('Analysis completed successfully', { ...context, phase: 'complete' });
  }

  analysisFailed(error: Error, context?: LogContext) {
    this.error('Analysis failed', error, { ...context, phase: 'failed' });
  }
}

// Экспортируем глобальный экземпляр логгера
export const logger = Logger.getInstance();
