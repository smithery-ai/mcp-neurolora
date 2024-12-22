import { readFile, writeFile } from 'fs/promises';
import { BASE_SERVERS, validateMcpSettings } from './types.js';

/**
 * Handle installation of base MCP servers
 */
export async function handleInstallBaseServers(configPath: string): Promise<string> {
  try {
    console.error('Reading config from:', configPath);

    // Read and parse configuration
    const configContent = await readFile(configPath, 'utf8');
    const parsedConfig = JSON.parse(configContent);
    const config = validateMcpSettings(parsedConfig);

    let serversAdded = 0;
    const existingServers = Object.keys(config.mcpServers);
    console.error('Existing servers:', existingServers.join(', '));
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
      // Validate and save updated configuration
      const validatedConfig = validateMcpSettings(config);
      const configStr = JSON.stringify(validatedConfig, null, 2);

      await writeFile(configPath, configStr);
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
