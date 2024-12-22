import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { handleAnalyzeCode } from './handler.js';
import { codeAnalyzerSchema, validateAnalyzerInput } from './types.js';
import { ConnectionAwareHandler } from '../../utils/connection-check.js';
import { ConnectionManager } from '../../server.js';

class ToolHandler implements ConnectionAwareHandler {
  private connectionManager: ConnectionManager | null = null;

  setConnectionManager(manager: ConnectionManager) {
    this.connectionManager = manager;
  }

  private getConnectionManager(): ConnectionManager {
    if (!this.connectionManager) {
      throw new Error('Connection manager not initialized');
    }
    return this.connectionManager;
  }

  async handle(args: Record<string, unknown>) {
    console.error('=== Code Analyzer Tool Handler ===');
    console.error('Arguments:', JSON.stringify(args, null, 2));

    const manager = this.getConnectionManager();
    if (!manager.isConnected()) {
      console.error('=== Code Analyzer Tool Handler Error ===');
      console.error('Not connected');
      console.error('===================================');
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

    try {
      // Валидируем входные данные с помощью Zod
      const validatedInput = validateAnalyzerInput(args);
      const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;

      if (!openaiKey) {
        console.error('=== Code Analyzer Tool Handler Error ===');
        console.error('OpenAI API key missing');
        console.error('===================================');
        return {
          content: [
            {
              type: 'text',
              text: 'OpenAI API key is required for code analysis. Please add OPENAI_API_KEY to your MCP server configuration.',
            },
          ],
          isError: true,
        };
      }

      const analysis = await handleAnalyzeCode({
        mode: 'analyze',
        input: validatedInput.input,
        outputPath: validatedInput.outputPath,
      });

      console.error('=== Code Analyzer Tool Handler Success ===');
      console.error('Analysis completed');
      console.error('===================================');
      return {
        content: [
          {
            type: 'text',
            text:
              `Code analyzed successfully:\n` +
              `- MD File: ${analysis.mdFilePath}\n` +
              `- Token Count: ${analysis.tokenCount}\n` +
              `- Issues Found: ${analysis.issues.length}\n\n` +
              `${analysis.issues.map((issue: { body: string }) => issue.body).join('\n\n')}`,
          },
        ],
      };
    } catch (error: unknown) {
      console.error('=== Code Analyzer Tool Handler Error ===');
      console.error('Error:', error);
      console.error('===================================');
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing code: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
}

const handler = new ToolHandler();

export const codeAnalyzerTool: Tool & { handler: ConnectionAwareHandler } = {
  name: 'analyze_code',
  description:
    'Analyze code using OpenAI API (requires your API key). Creates analysis files (LAST_RESPONSE_*.txt/json) in the project root directory. The analysis may take a few minutes.',
  inputSchema: codeAnalyzerSchema,
  handler,
};
