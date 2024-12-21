// Options for GitHub issues creator
export interface GitHubIssuesOptions {
  githubToken: string;
  owner: string;
  repo: string;
  issueNumbers?: number[]; // номера issues для создания (если не указаны, создаются все)
}

// Schema for GitHub issues creator
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

// Error types
export class GitHubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubError';
  }
}
