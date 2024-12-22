export type OpenAIResponse = {
  choices: Array<{ message: { content: string } }>;
};

export type OpenAICreateFn = () => Promise<OpenAIResponse>;

export interface OpenAIClient {
  chat: {
    completions: {
      create: OpenAICreateFn;
    };
  };
}

// Re-export for convenience
export type { OpenAIResponse as OpenAICompletionResponse };
