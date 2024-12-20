#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NeuroloraServer } from './server.js';

/**
 * Main entry point for the Neurolora MCP server
 */
async function main() {
  try {
    const server = new NeuroloraServer();
    const transport = new StdioServerTransport();
    await server.run(transport);
  } catch (error) {
    console.error('Failed to start Neurolora MCP server:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
