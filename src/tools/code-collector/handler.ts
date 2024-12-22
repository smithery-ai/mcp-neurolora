import fs from 'fs/promises';
import path from 'path';
import { getCodeAnalysisPrompt } from '../../prompts/index.js';
import { ConnectionManager } from '../../server.js';
import { CodeCollectorOptions } from '../../types/index.js';
import { ErrorMessages, getSafeErrorMessage } from '../../utils/error-messages.js';
import { CodeCollectorError, ConnectionError } from '../../utils/errors.js';
import { collectFiles } from '../../utils/fs.js';
import { logger } from '../../utils/logger.js';
import { safeReadFile, safeWriteFile } from '../../utils/safe-fs.js';
import { CodeCollectorResponse } from './types.js';
import { isPathAllowed } from '../../utils/path-validator.js';

/**
 * Code collector handler class
 */
export class CodeCollectorHandler {
  private connectionManager?: ConnectionManager;

  setConnectionManager(manager: ConnectionManager) {
    this.connectionManager = manager;
  }

  /**
   * Ensure connection is established with retry
   */
  private async checkConnection(retryCount = 0, maxRetries = 3): Promise<void> {
    if (!this.connectionManager) {
      throw new ConnectionError(ErrorMessages.CONNECTION_NOT_INITIALIZED);
    }

    if (!this.connectionManager.isConnected()) {
      if (retryCount >= maxRetries) {
        throw new ConnectionError(ErrorMessages.CONNECTION_NOT_ESTABLISHED);
      }

      logger.debug('Connection lost, attempting to reconnect...', {
        attempt: retryCount + 1,
        maxAttempts: maxRetries,
      });

      // Ждем перед повторной попыткой
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        await this.connectionManager.connect(ConnectionManager.currentTransport);
        logger.debug('Reconnection successful');
      } catch (error) {
        logger.debug('Reconnection failed, retrying...', {
          attempt: retryCount + 1,
          error: error instanceof Error ? error.message : String(error),
        });
        await this.checkConnection(retryCount + 1, maxRetries);
      }
    }
  }

  /**
   * Wrapper for operations that require connection
   */
  private async withConnection<T>(operation: () => Promise<T>): Promise<T> {
    await this.checkConnection();
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ConnectionError) {
        // Пробуем переподключиться и повторить операцию
        await this.checkConnection();
        return await operation();
      }
      throw error;
    }
  }

  /**
   * Handle code collection tool execution
   */
  async handleCollectCode(options: CodeCollectorOptions): Promise<CodeCollectorResponse> {
    try {
      logger.debug('Code collection started', { options });

      // Оборачиваем всю операцию в withConnection
      return await this.withConnection(async () => {
        // Validate and normalize paths
        const inputs = Array.isArray(options.input) ? options.input : [options.input];
        const normalizedInputs: string[] = [];

        for (const input of inputs) {
          // Проверяем, что путь абсолютный
          if (!path.isAbsolute(input)) {
            throw new CodeCollectorError(ErrorMessages.INVALID_PATH, 'invalid_path', {
              path: input,
            });
          }

          // Нормализуем путь и проверяем, что он разрешен
          const normalizedPath = path.resolve(input);
          if (!isPathAllowed(normalizedPath)) {
            throw new CodeCollectorError(ErrorMessages.PATH_NOT_ALLOWED, 'path_not_allowed', {
              path: input,
            });
          }

          normalizedInputs.push(normalizedPath);
        }

        // Validate output path
        if (!path.isAbsolute(options.outputPath)) {
          throw new CodeCollectorError(ErrorMessages.INVALID_PATH, 'invalid_path', {
            path: options.outputPath,
          });
        }

        const normalizedOutputPath = path.resolve(options.outputPath);
        if (!isPathAllowed(normalizedOutputPath)) {
          throw new CodeCollectorError(ErrorMessages.PATH_NOT_ALLOWED, 'path_not_allowed', {
            path: options.outputPath,
          });
        }

        // Generate output filename based on input
        const inputName = Array.isArray(options.input)
          ? 'COMBINED'
          : path.basename(options.input).toUpperCase();

        // Create output file path in project root
        const fileName = `PROMPT_ANALYZE_${inputName}.md`;
        const outputPath = path.join(options.outputPath, fileName);

        // Получаем паттерны игнорирования
        const { getIgnorePatterns } = await import('../../utils/ignore-patterns.js');
        const ignorePatterns =
          options.ignorePatterns || (await getIgnorePatterns(options.outputPath));
        logger.debug('Starting file collection...', { ignorePatterns });

        const files = await collectFiles(options.input, ignorePatterns);
        logger.debug(`Found ${files.length} files`);

        if (files.length === 0) {
          throw new CodeCollectorError(ErrorMessages.NO_FILES_FOUND, 'no_files', {
            input: options.input,
          });
        }

        logger.debug('Generating markdown...');

        // Generate markdown content
        const title = Array.isArray(options.input)
          ? 'Selected Files'
          : path.basename(options.input);

        // Get code analysis prompt
        const analysisPrompt = await getCodeAnalysisPrompt();

        let markdown = analysisPrompt + '\n\n';

        // Check for PROJECT_SUMMARY.md in project root
        const projectSummaryPath = path.join(
          path.dirname(options.outputPath),
          'PROJECT_SUMMARY.md'
        );
        try {
          const projectSummary = await safeReadFile(projectSummaryPath);
          markdown += `\n# Project Summary\n\n${projectSummary}\n\n---\n`;
        } catch (error) {
          // Если файл не найден, продолжаем без него
          logger.debug('PROJECT_SUMMARY.md not found, skipping...');
        }

        markdown += `\n# Code Collection: ${title}\n\n`;
        markdown += `Source: ${
          Array.isArray(options.input) ? options.input.join(', ') : options.input
        }\n\n`;

        // Table of contents
        markdown += '## Table of Contents\n\n';
        for (const file of files) {
          const anchor = file.relativePath.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          markdown += `- [${file.relativePath}](#${anchor})\n`;
        }

        // File contents
        markdown += '\n## Files\n\n';
        for (const file of files) {
          const anchor = file.relativePath.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          markdown += `### ${file.relativePath} {#${anchor}}\n`;
          markdown += '```' + file.language + '\n';
          markdown += file.content;
          markdown += '\n```\n\n';
        }

        // Проверяем состояние директории и файла
        const outputDir = path.dirname(outputPath);

        // Проверяем существование директории
        try {
          await fs.access(outputDir);
        } catch {
          throw new CodeCollectorError(ErrorMessages.PATH_NOT_FOUND, 'directory_not_found');
        }

        // Проверяем права на запись
        try {
          await fs.access(outputDir, fs.constants.W_OK);
        } catch {
          throw new CodeCollectorError(ErrorMessages.PERMISSION_DENIED, 'permission_denied');
        }

        // Записываем файл
        try {
          await safeWriteFile(outputPath, markdown, { append: false });
          logger.info(`Successfully collected ${files.length} files`, { outputPath });

          return {
            status: 'success',
            filesCount: files.length,
            outputPath: outputPath,
            message: `Successfully collected ${files.length} files`,
          };
        } catch (error) {
          throw new CodeCollectorError(ErrorMessages.FILE_WRITE_ERROR, 'write_failed');
        }
      });
    } catch (error) {
      if (error instanceof ConnectionError || error instanceof CodeCollectorError) {
        // Логируем полную информацию об ошибке для отладки
        logger.error(
          error instanceof Error ? error.message : 'Unknown error',
          error instanceof Error ? error : undefined,
          {
            component: 'CodeCollector',
            code: error instanceof CodeCollectorError ? error.code : 'connection_error',
          }
        );

        // Возвращаем безопасное сообщение пользователю
        return {
          status: 'error',
          error: error instanceof CodeCollectorError ? error.code : 'connection_error',
          message: getSafeErrorMessage(error),
          details: error instanceof CodeCollectorError ? error.details : undefined,
        };
      }

      // Неожиданная ошибка
      // Логируем полную информацию об ошибке для отладки
      logger.error(
        'Unexpected error during code collection',
        error instanceof Error ? error : undefined,
        {
          component: 'CodeCollector',
        }
      );

      // Возвращаем безопасное сообщение пользователю
      return {
        status: 'error',
        error: 'unexpected_error',
        message: ErrorMessages.UNEXPECTED_ERROR,
        details: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        },
      };
    }
  }
}

// Create instance
export const codeCollectorHandler = new CodeCollectorHandler();
