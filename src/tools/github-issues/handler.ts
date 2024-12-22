import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';
import path from 'path';
import { safeReadFile } from '../../utils/safe-fs.js';
import { GitHubError, GitHubIssuesOptions } from './types.js';

// Специфичные типы ошибок
class GitHubAuthError extends GitHubError {
  constructor(message: string) {
    super(`Authentication error: ${message}`);
    this.name = 'GitHubAuthError';
  }
}

class GitHubRateLimitError extends GitHubError {
  constructor(message: string) {
    super(`Rate limit exceeded: ${message}`);
    this.name = 'GitHubRateLimitError';
  }
}

class GitHubPermissionError extends GitHubError {
  constructor(message: string) {
    super(`Permission denied: ${message}`);
    this.name = 'GitHubPermissionError';
  }
}

class GitHubNotFoundError extends GitHubError {
  constructor(message: string) {
    super(`Not found: ${message}`);
    this.name = 'GitHubNotFoundError';
  }
}

class GitHubValidationError extends GitHubError {
  constructor(message: string) {
    super(`Validation error: ${message}`);
    this.name = 'GitHubValidationError';
  }
}

interface ParsedIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
}

/**
 * Parse response file with error handling
 */
async function parseResponseFile(filePath: string): Promise<ParsedIssue[]> {
  try {
    const content = await safeReadFile(filePath);

    let data;
    try {
      data = JSON.parse(content);
    } catch (error) {
      if (error instanceof Error) {
        throw new GitHubValidationError(`Invalid JSON format in response file: ${error.message}`);
      }
      throw new GitHubValidationError('Invalid JSON format in response file');
    }

    if (!data || !Array.isArray(data.issues)) {
      throw new GitHubValidationError('Response file does not contain valid issues array');
    }

    // Валидация структуры каждого issue
    data.issues.forEach((issue: any, index: number) => {
      if (!issue.number || !issue.title || !issue.body) {
        throw new GitHubValidationError(
          `Invalid issue structure at index ${index}: missing required fields`
        );
      }
      if (!Array.isArray(issue.labels)) {
        throw new GitHubValidationError(
          `Invalid issue structure at index ${index}: labels must be an array`
        );
      }
    });

    return data.issues;
  } catch (error) {
    if (error instanceof GitHubError) {
      throw error;
    }
    throw new GitHubError(`Failed to parse response file: ${(error as Error).message}`);
  }
}

/**
 * Handle GitHub API errors
 */
function handleGitHubApiError(error: unknown): never {
  if (error instanceof RequestError) {
    switch (error.status) {
      case 401:
        throw new GitHubAuthError('Invalid GitHub token');
      case 403:
        if (error.message.includes('rate limit')) {
          throw new GitHubRateLimitError(error.message);
        }
        throw new GitHubPermissionError(error.message);
      case 404:
        throw new GitHubNotFoundError('Repository not found');
      case 422:
        throw new GitHubValidationError(error.message);
      default:
        throw new GitHubError(`GitHub API error (${error.status}): ${error.message}`);
    }
  }
  throw new GitHubError(
    `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
  );
}

/**
 * Create GitHub issues from analysis results
 */
export async function handleGitHubIssues(options: GitHubIssuesOptions): Promise<string> {
  try {
    // Проверка входных данных
    if (!options.githubToken) {
      throw new GitHubAuthError('GitHub token is required in MCP server configuration');
    }

    if (!options.owner || !options.repo) {
      throw new GitHubValidationError('Repository owner and name are required');
    }

    const octokit = new Octokit({
      auth: options.githubToken,
    });

    // Проверяем доступ к репозиторию
    try {
      await octokit.repos.get({
        owner: options.owner,
        repo: options.repo,
      });
    } catch (error) {
      handleGitHubApiError(error);
    }

    // Парсим файл с результатами анализа
    const allIssues = await parseResponseFile(
      path.join(process.cwd(), 'LAST_RESPONSE_OPENAI_GITHUB_FORMAT.json')
    );

    if (allIssues.length === 0) {
      return 'No issues found in the analysis results';
    }

    // Фильтруем issues по номерам, если они указаны
    const issuesToCreate = options.issueNumbers
      ? allIssues.filter(issue => options.issueNumbers?.includes(issue.number))
      : allIssues;

    if (issuesToCreate.length === 0) {
      return 'No matching issues found with the specified numbers';
    }

    // Создаем issues с подробной обработкой ошибок
    const results = await Promise.allSettled(
      issuesToCreate.map(async issue => {
        try {
          const response = await octokit.issues.create({
            owner: options.owner,
            repo: options.repo,
            title: `[#${issue.number}] ${issue.title}`,
            body: issue.body,
            labels: issue.labels,
          });
          return {
            success: true,
            message: `Created issue #${issue.number}: ${issue.title} (GitHub #${response.data.number})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Failed to create issue #${issue.number}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          };
        }
      })
    );

    // Формируем детальный отчет
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failureCount = issuesToCreate.length - successCount;

    const report = [
      `Created ${successCount} issues, ${failureCount} failures`,
      '',
      ...results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value.message;
        }
        return `Error: ${result.reason}`;
      }),
    ];

    return report.join('\n');
  } catch (error) {
    if (error instanceof GitHubError) {
      throw error;
    }
    handleGitHubApiError(error);
  }
}
