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

class Configuration {
  apiKey: string;

  constructor(config: ConfigType) {
    this.apiKey = config.apiKey;
  }
}

class OpenAIApi {
  constructor(config: Configuration) {}

  createChatCompletion(): Promise<ChatCompletionResponse> {
    return Promise.resolve(mockResponse);
  }
}

const openai = {
  Configuration,
  OpenAIApi
};

export default openai;
