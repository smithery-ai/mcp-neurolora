import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { handleAnalyzeCode } from './handler.js';
import { codeAnalyzerSchema } from './types.js';

export const codeAnalyzerTool: Tool = {
  name: 'analyze_code',
  description:
    'Analyze code using OpenAI API (requires your API key). The analysis may take a few minutes. So, wait please.',
  inputSchema: codeAnalyzerSchema,
  handler: async (args: Record<string, unknown>) => {
    try {
      const codePath = String(args.codePath);
      const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;

      if (!openaiKey) {
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
        codePath,
      });

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
  },
};
