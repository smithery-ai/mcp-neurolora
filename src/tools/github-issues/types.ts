import { z } from 'zod';

// Options for GitHub issues creator
export interface GitHubIssuesOptions {
  githubToken: string;
  owner: string;
  repo: string;
  issueNumbers?: number[]; // номера issues для создания (если не указаны, создаются все)
}

// Zod schema for validation
const zodGitHubIssuesSchema = z
  .object({
    owner: z.string({
      description: 'GitHub repository owner',
    }),
    repo: z.string({
      description: 'GitHub repository name',
    }),
    issueNumbers: z
      .array(z.number(), {
        description: 'Issue numbers to create (optional, creates all issues if not specified)',
      })
      .optional(),
  })
  .strict();

// Convert Zod schema to JSON Schema for MCP SDK
export const githubIssuesSchema = {
  type: 'object',
  properties: {
    owner: {
      type: 'string',
      description: 'GitHub repository owner',
    },
    repo: {
      type: 'string',
      description: 'GitHub repository name',
    },
    issueNumbers: {
      type: 'array',
      items: {
        type: 'number',
      },
      description: 'Issue numbers to create (optional, creates all issues if not specified)',
    },
  },
  required: ['owner', 'repo'],
  additionalProperties: false,
} as const;

// Export type for TypeScript usage
export type GitHubIssuesInput = z.infer<typeof zodGitHubIssuesSchema>;

// Validation function using Zod
export function validateGitHubIssuesInput(input: unknown): GitHubIssuesInput {
  return zodGitHubIssuesSchema.parse(input);
}

// Error types
export class GitHubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubError';
  }
}
