/**
 * Environment configuration
 */
export const ENV = {
  maxTokens: parseInt(process.env.MAX_TOKENS || '190000'),
  timeoutMs: parseInt(process.env.TIMEOUT_MS || '300000'),
  cacheMaxSize: 100 * 1024 * 1024, // 100MB
  cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  cacheCleanupInterval: 60 * 60 * 1000, // 1 hour
};

/**
 * Default server configuration
 */
export const SERVER_CONFIG = {
  version: '1.4.0',
  maxRetries: 3,
  retryDelay: 1000,
};
