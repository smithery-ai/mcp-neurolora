import { jest } from '@jest/globals';

const mockResponse = {
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

export const Configuration = jest.fn();
export const OpenAIApi = jest.fn().mockImplementation(() => ({
  createChatCompletion: jest.fn().mockResolvedValue(mockResponse)
}));

// Ensure the mock is properly typed
(Configuration as jest.Mock).mockImplementation((config: { apiKey: string }) => config);
(OpenAIApi as jest.Mock).mockImplementation(() => ({
  createChatCompletion: jest.fn().mockResolvedValue(mockResponse)
}));
