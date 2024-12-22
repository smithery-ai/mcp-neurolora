/**
 * Configuration values for the application
 */

export interface FileSystemConfig {
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Default patterns to ignore when collecting files */
  defaultIgnorePatterns: string[];
  /** Maximum recursion depth for directory traversal */
  maxRecursionDepth: number;
  /** Timeout for regex pattern matching (ms) */
  regexTimeout: number;
  /** Custom path to .neuroloraignore file */
  ignorePath?: string;
}

export interface OpenAIConfig {
  /** Maximum tokens for code analysis */
  maxTokens: number;
  /** Model to use for analysis */
  model: string;
  /** Request timeout in milliseconds */
  requestTimeout: number;
}

export interface Config {
  fs: FileSystemConfig;
  openai: OpenAIConfig;
}

/**
 * Default configuration values
 */
export const defaultConfig: Config = {
  fs: {
    maxFileSize: 1024 * 1024, // 1MB
    maxRecursionDepth: 20,
    regexTimeout: 100,
    ignorePath: undefined, // Will be set from environment or config
    defaultIgnorePatterns: [
      // Dependencies and build artifacts
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      '.nuxt/',
      '.cache/',
      '*.min.js',
      '*.min.css',
      '*.map',

      // Version control
      '.git/',
      '.svn/',
      '.hg/',

      // Environment and configuration
      '.env*',
      '*.config.js',
      '*.conf',
      'config.*',
      '.npmrc',
      '.yarnrc',
      '.boto',
      'credentials',
      'id_rsa',
      'id_dsa',
      '*.pem',
      '*.key',
      '*.cert',
      '*.crt',

      // Cache and temporary files
      '__pycache__/',
      '*.pyc',
      'venv/',
      '.idea/',
      '.vscode/',
      'coverage/',
      '.DS_Store',
      'Thumbs.db',
      '*.swp',
      '*.swo',
      '*.bak',
      '*.tmp',
      '*.temp',

      // Lock files
      '*.lock',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',

      // Compiled binaries
      '*.o',
      '*.obj',
      '*.class',
      '*.exe',
      '*.dll',
      '*.so',
      '*.dylib',

      // Logs
      '*.log',
      'logs/',
      'debug.log*',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',

      // Database files
      '*.sqlite',
      '*.db',
      '*.sql',

      // Test coverage
      '.nyc_output/',
      'coverage/',

      // Docker
      'Dockerfile',
      'docker-compose*.yml',

      // Kubernetes
      'k8s/',
      '*.yaml',
      '*.yml',
    ],
  },
  openai: {
    maxTokens: 190000,
    model: 'o1-preview',
    requestTimeout: 5 * 60 * 1000, // 5 minutes
  },
};

/**
 * Configuration validation error
 */
class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validate configuration values
 */
function validateConfig(config: Config): void {
  // Validate file system config
  if (config.fs.maxFileSize <= 0) {
    throw new ConfigValidationError('maxFileSize must be greater than 0');
  }
  if (config.fs.maxRecursionDepth <= 0) {
    throw new ConfigValidationError('maxRecursionDepth must be greater than 0');
  }
  if (config.fs.regexTimeout <= 0) {
    throw new ConfigValidationError('regexTimeout must be greater than 0');
  }

  // Validate OpenAI config
  if (config.openai.maxTokens <= 0) {
    throw new ConfigValidationError('maxTokens must be greater than 0');
  }
  if (!config.openai.model) {
    throw new ConfigValidationError('model must not be empty');
  }
  if (config.openai.requestTimeout <= 0) {
    throw new ConfigValidationError('requestTimeout must be greater than 0');
  }
}

/**
 * Load configuration from environment variables
 */
function loadConfigFromEnv(): Partial<Config> {
  const config: Partial<Config> = {};

  // Load file system config
  if (
    process.env.MAX_FILE_SIZE ||
    process.env.MAX_RECURSION_DEPTH ||
    process.env.REGEX_TIMEOUT ||
    process.env.IGNORE_PATH
  ) {
    config.fs = {
      maxFileSize: process.env.MAX_FILE_SIZE
        ? parseInt(process.env.MAX_FILE_SIZE)
        : defaultConfig.fs.maxFileSize,
      maxRecursionDepth: process.env.MAX_RECURSION_DEPTH
        ? parseInt(process.env.MAX_RECURSION_DEPTH)
        : defaultConfig.fs.maxRecursionDepth,
      regexTimeout: process.env.REGEX_TIMEOUT
        ? parseInt(process.env.REGEX_TIMEOUT)
        : defaultConfig.fs.regexTimeout,
      defaultIgnorePatterns: defaultConfig.fs.defaultIgnorePatterns,
      ignorePath: process.env.IGNORE_PATH,
    };
  }

  // Load OpenAI config
  if (process.env.MAX_TOKENS || process.env.OPENAI_MODEL || process.env.REQUEST_TIMEOUT) {
    config.openai = {
      maxTokens: process.env.MAX_TOKENS
        ? parseInt(process.env.MAX_TOKENS)
        : defaultConfig.openai.maxTokens,
      model: process.env.OPENAI_MODEL || defaultConfig.openai.model,
      requestTimeout: process.env.REQUEST_TIMEOUT
        ? parseInt(process.env.REQUEST_TIMEOUT)
        : defaultConfig.openai.requestTimeout,
    };
  }

  return config;
}

/**
 * Deep merge configuration objects
 */
function deepMerge(target: Config, source: Partial<Config>): Config {
  return {
    fs: {
      ...target.fs,
      ...source.fs,
      // Preserve default ignore patterns
      defaultIgnorePatterns: target.fs.defaultIgnorePatterns,
    },
    openai: {
      ...target.openai,
      ...source.openai,
    },
  };
}

// Load and validate configuration
const envConfig = loadConfigFromEnv();
export const config = deepMerge(defaultConfig, envConfig);

try {
  validateConfig(config);
} catch (error) {
  if (error instanceof ConfigValidationError) {
    console.error('Configuration validation failed:', error.message);
    console.error('Using default configuration');
  } else {
    throw error;
  }
}

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('Current configuration:', JSON.stringify(config, null, 2));
}
