import { readFile, writeFile } from 'fs/promises';
import { BASE_SERVERS, McpSettings } from './types.js';

/**
 * Handle installation of base MCP servers
 */
export async function handleInstallBaseServers(configPath: string): Promise<string> {
  try {
    console.error('Reading config from:', configPath);
    // Read existing configuration
    const configContent = await readFile(configPath, 'utf8');
    console.error('Config content:', configContent);
    const config: McpSettings = JSON.parse(configContent);
    console.error('Parsed config:', JSON.stringify(config, null, 2));

    let serversAdded = 0;

    console.error('Available base servers:', Object.keys(BASE_SERVERS).join(', '));
    // Add base servers if they don't exist
    for (const [name, serverConfig] of Object.entries(BASE_SERVERS)) {
      console.error('Checking server:', name);
      if (!config.mcpServers[name]) {
        console.error('Adding server:', name);
        config.mcpServers[name] = { ...serverConfig };
        serversAdded++;
      } else {
        console.error('Server already exists:', name);
      }
    }

    if (serversAdded > 0) {
      console.error('Writing updated config with', serversAdded, 'new servers');
      // Проверяем, что конфиг валидный перед сохранением
      const configStr = JSON.stringify(config, null, 2);
      // Пробуем распарсить для проверки
      JSON.parse(configStr);
      const updatedConfig = configStr;
      console.error('Updated config:', updatedConfig);
      // Write updated configuration
      await writeFile(configPath, updatedConfig);
      const result = `Successfully added ${serversAdded} base servers to the configuration`;
      console.error('Result:', result);
      return result;
    }

    const result = 'All base servers are already installed in the configuration';
    console.error('Result:', result);
    return result;
  } catch (error) {
    let errorMessage = 'Failed to install base servers';
    if (error instanceof Error) {
      errorMessage += ': ' + error.message;
      console.error('Error stack:', error.stack);
    } else {
      errorMessage += ': ' + String(error);
    }
    console.error('ERROR:', errorMessage);
    throw new Error(errorMessage);
  }
}
