You are a strict senior software architect performing a thorough code review. Your analysis should be critical and thorough, focusing on security, performance, and architectural issues.

Categorize each finding by severity:
- CRITICAL: Security vulnerabilities, data loss risks, major performance issues
- ERROR: Bugs, memory leaks, incorrect implementations
- WARNING: Code smells, maintainability issues, unclear patterns
- IMPROVE: Optimization opportunities, architectural enhancements

For each issue found, use this exact format with all fields required:

{number}. [ ] ISSUE {SEVERITY}: {short title}

Title: {clear and concise issue title}

Description: {detailed description of the problem}

Best Practice Violation: {what standards or practices are being violated}

Impact:
{bullet points listing specific impacts}

Steps to Fix:
{numbered list of specific steps to resolve the issue}

Labels: {comma-separated list of labels}

---

Example:
1. [ ] ISSUE CRITICAL: SQL Injection Risk in Query Builder

Title: Unescaped User Input Used Directly in SQL Query

Description: The query builder concatenates user input directly into SQL queries without proper escaping or parameterization, creating a severe security vulnerability.

Best Practice Violation: All user input must be properly escaped or use parameterized queries to prevent SQL injection attacks.

Impact:
- Potential database compromise through SQL injection
- Unauthorized data access
- Possible data loss or corruption
- Security breach vulnerability

Steps to Fix:
1. Replace string concatenation with parameterized queries
2. Add input validation layer
3. Implement proper escaping for special characters
4. Add SQL injection tests

Labels: security, priority-critical, effort-small

---

Analysis criteria (be thorough and strict):
1. Security:
   - SQL injection risks
   - XSS vulnerabilities
   - Unsafe data handling
   - Exposed secrets
   - Insecure dependencies

2. Performance:
   - Inefficient algorithms (O(n²) or worse)
   - Memory leaks
   - Unnecessary computations
   - Resource management issues
   - Unoptimized database queries

3. Architecture:
   - SOLID principles violations
   - Tight coupling
   - Global state usage
   - Unclear boundaries
   - Mixed responsibilities

4. Code Quality:
   - Missing error handling
   - Untestable code
   - Code duplication
   - Complex conditionals
   - Deep nesting

Label types:
- security: Security vulnerabilities and risks
- performance: Performance issues and bottlenecks
- architecture: Design and structural problems
- reliability: Error handling and stability issues
- maintainability: Code organization and clarity
- scalability: Growth and scaling concerns
- testing: Test coverage and testability

Priority levels:
- priority-critical: Fix immediately (security risks, data loss)
- priority-high: Fix in next release (bugs, performance)
- priority-medium: Plan to fix soon (code quality)
- priority-low: Consider fixing (improvements)

Effort estimates:
- effort-small: simple changes, up to 1 day
- effort-medium: moderate changes, 2-3 days
- effort-large: complex changes, more than 3 days

Code to analyze:
---

# Code Collection: server.ts

Source: /Users/fadandr/Custom Projects/Custom MCP/aindreyway-mcp-neurolora/src/server.ts

## Table of Contents

- [../src/server.ts](#-src-server-ts)

## Files

### ../src/server.ts {#-src-server-ts}
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import { tools } from './tools/index.js';

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}>;

/**
 * Main MCP server class for Neurolora functionality
 */
const ENV = {
  isLocal: process.env.MCP_ENV === 'local',
  storagePath: process.env.STORAGE_PATH || 'data',
  maxTokens: parseInt(process.env.MAX_TOKENS || '190000'),
  timeoutMs: parseInt(process.env.TIMEOUT_MS || '300000'),
};

export class NeuroloraServer {
  private server: Server;
  private isLocal: boolean;

  constructor() {
    this.isLocal = ENV.isLocal;
    const serverName = this.isLocal ? 'local-mcp-neurolora' : '@aindreyway/mcp-neurolora';

    // Инициализация сервера с учетом режима работы
    this.server = new Server({
      name: serverName,
      version: '1.2.3',
      capabilities: {
        tools: {},
      },
      timeout: ENV.timeoutMs,
    });

    // Дополнительная отладочная информация в локальном режиме
    if (this.isLocal) {
      console.error('[LOCAL VERSION] Running in development mode');
      console.error(`[LOCAL VERSION] Storage path: ${ENV.storagePath}`);
      console.error(`[LOCAL VERSION] Max tokens: ${ENV.maxTokens}`);
      console.error(`[LOCAL VERSION] Timeout: ${ENV.timeoutMs}ms`);
    }

    // Register tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const tool = tools.find(t => t.name === request.params.name);
      if (!tool) {
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${request.params.name}`,
            },
          ],
          isError: true,
        };
      }

      try {
        const handler = tool?.handler as ToolHandler;
        return handler(request.params.arguments || {});
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // Error handling с учетом режима работы
    this.server.onerror = async error => {
      const prefix = this.isLocal ? '[LOCAL VERSION][MCP Error]' : '[MCP Error]';
      console.error(prefix, error);

      // Если это ошибка подключения, пробуем переподключиться
      if (error instanceof Error && error.message.includes('connection')) {
        console.error('Connection error detected, attempting to reconnect...');
        try {
          await this.server.close();
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.reconnect(this.currentTransport);
        } catch (reconnectError) {
          console.error('Failed to reconnect:', reconnectError);
        }
      }
    };
  }

  /**
   * Start the MCP server
   */
  private currentTransport: any;

  private async reconnect(transport: any, retryCount = 0, maxRetries = 3) {
    this.currentTransport = transport;
    try {
      await this.server.connect(transport);
      console.error('✅ Neurolora MCP server connected successfully');
    } catch (error) {
      if (retryCount < maxRetries) {
        console.error(`Retrying connection (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Ждем секунду перед повторной попыткой
        await this.reconnect(transport, retryCount + 1, maxRetries);
      } else {
        throw error;
      }
    }
  }

  async run(transport: any) {
    // Устанавливаем рабочую директорию в директорию запуска сервера
    const serverDir = process.argv[1] ? path.dirname(process.argv[1]) : process.cwd();
    process.chdir(serverDir);
    console.error('Neurolora MCP server running from:', serverDir);

    try {
      await this.reconnect(transport);
    } catch (error) {
      console.error('Failed to connect after retries:', error);
      process.exit(1);
    }

    // Обработка сигналов для graceful shutdown
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.error(`\nReceived ${signal}, shutting down...`);
        try {
          await this.server.close();
          console.error('Server closed successfully');
        } catch (error) {
          console.error('Error during shutdown:', error);
        }
        process.exit(0);
      });
    });
  }
}

```

