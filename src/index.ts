#!/usr/bin/env node

// Отключаем предупреждение о punycode
process.removeAllListeners('warning');
process.on('warning', warning => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('punycode')) {
    return;
  }
  console.warn(warning);
});

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NeuroloraServer } from './server.js';

// Set long timeout for MCP operations
process.env.MCP_TIMEOUT = '300000';

/**
 * Main entry point for the Neurolora MCP server
 */
async function main() {
  try {
    // Start MCP server
    const transport = new StdioServerTransport();
    const server = await NeuroloraServer.create();
    await server.run(transport);

    // Ждем полного подключения сервера
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Handle CLI commands through MCP server
    const args = process.argv.slice(2);
    if (args.length > 0) {
      const command = args[0];
      const options: Record<string, string> = {};

      // Parse command line arguments
      let currentKey: string | null = null;
      args.slice(1).forEach(arg => {
        if (arg.startsWith('--')) {
          // Если это новый ключ
          if (currentKey) {
            // Если был предыдущий ключ без значения, сохраняем его как пустую строку
            options[currentKey] = '';
          }
          currentKey = arg.slice(2);

          // Проверяем, есть ли значение после =
          const equalIndex = currentKey.indexOf('=');
          if (equalIndex !== -1) {
            options[currentKey.slice(0, equalIndex)] = currentKey.slice(equalIndex + 1);
            currentKey = null;
          }
        } else if (currentKey) {
          // Если это значение для текущего ключа
          options[currentKey] = arg;
          currentKey = null;
        }
      });

      // Обрабатываем последний ключ, если он остался
      if (currentKey) {
        options[currentKey] = '';
      }

      // Экранируем специальные символы в путях
      if (options.input) {
        options.input = options.input.replace(/\\ /g, ' ');
      }
      if (options.output) {
        options.output = options.output.replace(/\\ /g, ' ');
      }

      // Преобразуем параметры в соответствии с ожидаемыми именами
      const toolArgs: Record<string, string> = {};
      if (options.input) {
        toolArgs.input = options.input;
      }
      if (options.output) {
        toolArgs.outputPath = options.output;
      }

      try {
        // Send command through MCP
        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: command,
            arguments: toolArgs,
          },
        };

        // Write request to stdin with proper formatting
        const formattedRequest = JSON.stringify(request);
        console.error('[DEBUG] Sending request:', JSON.stringify(request, null, 2));
        console.error('[DEBUG] Arguments:', JSON.stringify(options, null, 2));

        // Ждем полного подключения сервера
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Отправляем запрос через сервер
        const response = await server.request(request);

        if (!response) {
          throw new Error('No response received from server');
        }

        console.error('[DEBUG] Response:', JSON.stringify(response, null, 2));

        // Выводим результат в stdout
        if (response.result?.content) {
          for (const content of response.result.content) {
            if (content.type === 'text') {
              console.log(content.text);
            }
          }
        }
      } catch (error) {
        console.error('Failed to execute command:', error);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Failed to start Neurolora MCP server:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
