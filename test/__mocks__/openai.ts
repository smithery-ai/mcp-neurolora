import { jest } from '@jest/globals';

interface ConfigType {
  apiKey: string;
}

interface ChatCompletionResponse {
  data: {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  };
}

const mockResponse: ChatCompletionResponse = {
  data: {
    choices: [
      {
        message: {
          content: 'Mocked OpenAI response for testing'
        }
      }
    ]
  }
};

interface MockApi {
  createChatCompletion: () => Promise<ChatCompletionResponse>;
}

function createMockApi(): MockApi {
  return {
    createChatCompletion: () => Promise.resolve(mockResponse)
  };
}

export class Configuration {
  apiKey: string;

  constructor(config: ConfigType) {
    this.apiKey = config.apiKey;
  }
}

export class OpenAIApi {
  constructor(config: Configuration) {}

  createChatCompletion(): Promise<ChatCompletionResponse> {
    return Promise.resolve(mockResponse);
  }
}
