import { ConnectionManager } from '../server.js';

/**
 * Interface for tool handlers that need connection state
 */
export interface ConnectionAwareHandler {
  setConnectionManager(manager: ConnectionManager): void;
  handle(args: Record<string, unknown>): Promise<{
    content: Array<{
      type: string;
      text: string;
    }>;
    isError?: boolean;
  }>;
}
