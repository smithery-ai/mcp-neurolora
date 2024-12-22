import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { handleGitHubIssues } from './handler.js';
import { githubIssuesSchema, validateGitHubIssuesInput } from './types.js';

export const githubIssuesTool: Tool = {
  name: 'create_github_issues',
  description: 'Create GitHub issues from analysis results. Requires GitHub token.',
  inputSchema: githubIssuesSchema,
  handler: async (args: Record<string, unknown>) => {
    try {
      const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
      if (!githubToken) {
        return {
          content: [
            {
              type: 'text',
              text: 'GitHub token is required. Please add GITHUB_PERSONAL_ACCESS_TOKEN to your MCP server configuration.',
            },
          ],
          isError: true,
        };
      }

      // Валидируем входные данные с помощью Zod
      const validatedInput = validateGitHubIssuesInput(args);

      const result = await handleGitHubIssues({
        githubToken,
        ...validatedInput,
      });

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error creating GitHub issues: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
};
