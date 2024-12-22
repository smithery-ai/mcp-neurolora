export type GitHubIssueResponse = {
  data: { 
    number: number;
    html_url: string;
  };
};

export type GitHubListResponse = {
  data: any[];
};

export type GitHubRepoResponse = {
  data: { 
    default_branch: string;
    owner?: { login: string };
    name?: string;
  };
};

export type GitHubIssueCreateFn = () => Promise<GitHubIssueResponse>;
export type GitHubIssueListFn = () => Promise<GitHubListResponse>;
export type GitHubRepoGetFn = () => Promise<GitHubRepoResponse>;

export interface GitHubClient {
  rest: {
    issues: {
      create: GitHubIssueCreateFn;
      list: GitHubIssueListFn;
    };
    repos: {
      get: GitHubRepoGetFn;
    };
  };
}
