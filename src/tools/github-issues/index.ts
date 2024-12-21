import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { handleGitHubIssues } from './handler.js';
import { githubIssuesSchema } from './types.js';

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

      const options = {
        githubToken,
        owner: String(args.owner),
        repo: String(args.repo),
        issueNumbers: args.issueNumbers as number[] | undefined,
      };

      const result = await handleGitHubIssues(options);
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
