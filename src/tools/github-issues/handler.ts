import { Octokit } from '@octokit/rest';
import path from 'path';
import { safeReadFile } from '../../utils/safe-fs.js';
import { GitHubError, GitHubIssuesOptions } from './types.js';

interface ParsedIssue {
  number: number;
  title: string;
  body: string;
  labels: string[];
}

async function parseResponseFile(filePath: string): Promise<ParsedIssue[]> {
  try {
    const content = await safeReadFile(filePath);
    const data = JSON.parse(content);
    return data.issues;
  } catch (error) {
    if (error instanceof GitHubError) {
      throw error;
    }
    throw new GitHubError(`Failed to parse conversation file: ${(error as Error).message}`);
  }
}

export async function handleGitHubIssues(options: GitHubIssuesOptions): Promise<string> {
  try {
    if (!options.githubToken) {
      throw new GitHubError(
        'GitHub token is required. Please add your GitHub token to the MCP server configuration.'
      );
    }

    const octokit = new Octokit({
      auth: options.githubToken,
    });

    // Парсим файл с результатами анализа
    const allIssues = await parseResponseFile(
      path.join(process.cwd(), 'LAST_RESPONSE_OPENAI.json')
    );
    if (allIssues.length === 0) {
      return 'No issues found in the conversation file';
    }

    // Фильтруем issues по номерам, если они указаны
    const issuesToCreate = options.issueNumbers
      ? allIssues.filter(issue => options.issueNumbers?.includes(issue.number))
      : allIssues;

    if (issuesToCreate.length === 0) {
      return 'No matching issues found with the specified numbers';
    }

    // Создаем issues
    const results = await Promise.all(
      issuesToCreate.map(async issue => {
        try {
          await octokit.issues.create({
            owner: options.owner,
            repo: options.repo,
            title: `[#${issue.number}] ${issue.title}`,
            body: issue.body,
            labels: issue.labels,
          });
          return `Created issue #${issue.number}: ${issue.title}`;
        } catch (error) {
          return `Failed to create issue #${issue.number}: ${
            error instanceof Error ? error.message : String(error)
          }`;
        }
      })
    );

    return results.join('\n');
  } catch (error) {
    if (error instanceof GitHubError) {
      throw error;
    }
    throw new GitHubError(`Failed to create GitHub issues: ${(error as Error).message}`);
  }
}
