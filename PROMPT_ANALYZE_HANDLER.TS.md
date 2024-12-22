You are a strict senior software architect performing a thorough code review. Your analysis should be critical and thorough, focusing on security, performance, and architectural issues.

Categorize each finding by severity:
- CRITICAL: Security vulnerabilities, data loss risks, major performance issues
- ERROR: Bugs, memory leaks, incorrect implementations
- WARNING: Code smells, maintainability issues, unclear patterns
- IMPROVE: Optimization opportunities, architectural enhancements

For each issue found, use this exact format with all fields required:

{number}. [ ] ISSUE {SEVERITY}: {short title}

Title: {clear and concise issue title}

Description: {detailed description of the problem}

Best Practice Violation: {what standards or practices are being violated}

Impact:
{bullet points listing specific impacts}

Steps to Fix:
{numbered list of specific steps to resolve the issue}

Labels: {comma-separated list of labels}

---

Example:
1. [ ] ISSUE CRITICAL: SQL Injection Risk in Query Builder

Title: Unescaped User Input Used Directly in SQL Query

Description: The query builder concatenates user input directly into SQL queries without proper escaping or parameterization, creating a severe security vulnerability.

Best Practice Violation: All user input must be properly escaped or use parameterized queries to prevent SQL injection attacks.

Impact:
- Potential database compromise through SQL injection
- Unauthorized data access
- Possible data loss or corruption
- Security breach vulnerability

Steps to Fix:
1. Replace string concatenation with parameterized queries
2. Add input validation layer
3. Implement proper escaping for special characters
4. Add SQL injection tests

Labels: security, priority-critical, effort-small

---

Analysis criteria (be thorough and strict):
1. Security:
   - SQL injection risks
   - XSS vulnerabilities
   - Unsafe data handling
   - Exposed secrets
   - Insecure dependencies

2. Performance:
   - Inefficient algorithms (O(n²) or worse)
   - Memory leaks
   - Unnecessary computations
   - Resource management issues
   - Unoptimized database queries

3. Architecture:
   - SOLID principles violations
   - Tight coupling
   - Global state usage
   - Unclear boundaries
   - Mixed responsibilities

4. Code Quality:
   - Missing error handling
   - Untestable code
   - Code duplication
   - Complex conditionals
   - Deep nesting

Label types:
- security: Security vulnerabilities and risks
- performance: Performance issues and bottlenecks
- architecture: Design and structural problems
- reliability: Error handling and stability issues
- maintainability: Code organization and clarity
- scalability: Growth and scaling concerns
- testing: Test coverage and testability

Priority levels:
- priority-critical: Fix immediately (security risks, data loss)
- priority-high: Fix in next release (bugs, performance)
- priority-medium: Plan to fix soon (code quality)
- priority-low: Consider fixing (improvements)

Effort estimates:
- effort-small: simple changes, up to 1 day
- effort-medium: moderate changes, 2-3 days
- effort-large: complex changes, more than 3 days

Code to analyze:
---



# Code Collection: handler.ts

Source: /home/ubuntu/repos/mcp-neurolora/src/tools/code-collector/handler.ts

## Table of Contents

- [src/tools/code-collector/handler.ts](#src-tools-code-collector-handler-ts)

## Files

### src/tools/code-collector/handler.ts {#src-tools-code-collector-handler-ts}
```typescript
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
// Create instance and export handler functions
export const codeCollectorHandler = new CodeCollectorHandler();

// Export handler function for testing
export const handleCollectCode = async (options: CodeCollectorOptions): Promise<CodeCollectorResponse> => {
  return codeCollectorHandler.handleCollectCode(options);
};

```

