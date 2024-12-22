import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { codeCollectorSchema, validateCollectorInput, CodeCollectorResponse } from './types.js';
import { codeCollectorHandler } from './handler.js';
import { ConnectionAwareHandler } from '../../utils/connection-check.js';
import { ConnectionManager } from '../../server.js';

class ToolHandler implements ConnectionAwareHandler {
  private connectionManager: ConnectionManager | null = null;

  setConnectionManager(manager: ConnectionManager) {
    this.connectionManager = manager;
    codeCollectorHandler.setConnectionManager(manager);
  }

  private getConnectionManager(): ConnectionManager {
    if (!this.connectionManager) {
      throw new Error('Connection manager not initialized');
    }
    return this.connectionManager;
  }

  async handle(args: Record<string, unknown>) {
    const manager = this.getConnectionManager();
    if (!manager.isConnected()) {
      return {
        content: [
          {
            type: 'text',
            text: 'Server is not connected. Please wait for connection to be established or try reconnecting.',
          },
        ],
        isError: true,
      };
    }

    console.error('[DEBUG] Received arguments:', JSON.stringify(args, null, 2));
    // Валидируем входные данные с помощью Zod
    const validatedInput = validateCollectorInput(args);
    console.error('[DEBUG] Validated input:', JSON.stringify(validatedInput, null, 2));

    try {
      const response = await codeCollectorHandler.handleCollectCode({
        input: validatedInput.input,
        outputPath: validatedInput.outputPath,
        ignorePatterns: validatedInput.ignorePatterns,
      });

      if (response.status === 'success') {
        return {
          content: [
            {
              type: 'text',
              text:
                response.message +
                (response.outputPath ? `\nOutput saved to: ${response.outputPath}` : ''),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text:
                response.message +
                (response.details?.checks && Array.isArray(response.details.checks)
                  ? '\n\nPlease check:\n' +
                    response.details.checks.map((check: string) => `- ${check}`).join('\n')
                  : ''),
            },
          ],
          isError: true,
        };
      }
    } catch (error) {
      console.error('Code collection error:', error);
      let errorMessage = 'Failed to collect code.';

      // Проверяем, является ли ошибка нашим типом ответа
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 'error' &&
        'message' in error &&
        'details' in error
      ) {
        const errorResponse = error as CodeCollectorResponse & { status: 'error' };
        errorMessage = errorResponse.message;
        if (errorResponse.details?.checks && Array.isArray(errorResponse.details.checks)) {
          errorMessage +=
            '\n\nPlease check:\n' +
            errorResponse.details.checks.map((check: string) => `- ${check}`).join('\n');
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = String(error);
      }

      return {
        content: [
          {
            type: 'text',
            text: errorMessage,
          },
        ],
        isError: true,
      };
    }
  }
}

const handler = new ToolHandler();

export const codeCollectorTool: Tool & { handler: ConnectionAwareHandler } = {
  name: 'collect_code',
  description: 'Collect all code from a directory into a single markdown file in the project root',
  inputSchema: codeCollectorSchema,
  handler,
};
