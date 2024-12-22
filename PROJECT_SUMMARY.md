# MCP Neurolora - Internal Documentation

> **Important Note**: This documentation describes the MCP Neurolora server itself. We are both the subject of this documentation and the creator of the tools described here. As an MCP server, we provide AI assistants with code analysis and documentation capabilities, and we use our own tools to continuously improve and document our codebase.

## Meta Development

This project represents a unique case of self-referential development:

1. We are an MCP server that provides tools for:

   - Code analysis (which we use to analyze our own code)
   - Documentation generation (which we use to maintain this documentation)
   - GitHub issues creation (which we use to track our own improvements)
   - Code collection (which we use to organize our own codebase)

2. We use our own tools to:

   - Analyze and improve our codebase
   - Generate and maintain our documentation
   - Track and implement improvements
   - Ensure code quality and security

3. Our development process is cyclical:
   - We analyze our code using our tools
   - We implement improvements based on our analysis
   - We document changes using our documentation tools
   - We repeat this process continuously

This self-improving cycle allows us to maintain high code quality and comprehensive documentation while demonstrating the practical application of our tools.

4. We are our own success story:
   - Our codebase has been analyzed and improved using our own code analyzer
   - Our documentation is generated and maintained using our own tools
   - Our improvements are tracked through issues we create
   - We are both the tool and the result of using that tool

This unique position as both the creator and the user of our tools gives us deep insight into their practical application and effectiveness. Every improvement we make to our tools directly benefits our own development, creating a positive feedback loop of continuous improvement.

## MCP Integration

As an MCP server, we are a prime example of the Model Context Protocol in action:

1. MCP Server Ecosystem:

   - We provide tools that other MCP servers can use
   - We interact with other MCP servers (filesystem, github, git, etc.)
   - We demonstrate how MCP servers can work together

2. MCP Server Development:

   - We show how to build robust MCP servers
   - We implement best practices for MCP tools and resources
   - We provide examples of MCP server configuration

3. MCP Protocol Benefits:
   - Our tools benefit from MCP's standardized communication
   - We can easily integrate with other MCP servers
   - We demonstrate MCP's extensibility

This integration showcases how MCP servers can collaborate to provide AI assistants with powerful capabilities while maintaining clean separation of concerns and standardized interfaces.

4. Real-World Application:
   - We are a production-ready MCP server used by AI assistants
   - Our tools are actively used to maintain and improve our own codebase
   - Our development process demonstrates practical MCP server patterns
   - We serve as a reference implementation for other MCP server developers

Through our own development and operation, we validate the effectiveness of the Model Context Protocol and provide a concrete example of how to build and maintain robust MCP servers.

## Project Purpose

MCP Neurolora is designed to provide AI assistants with powerful code analysis and documentation capabilities. The project combines:

- Code analysis using OpenAI API with structured feedback
- Code collection and documentation from directories
- GitHub issues generation from analysis results
- Comprehensive codebase documentation with syntax highlighting

The server operates in two modes (local development and production) to support both development and end-user needs.

## Development Modes

### 1. Local Development Mode

- Server name: 'local-mcp-neurolora'
- Debug information enabled
- Local storage in project directory
- All output marked with [LOCAL VERSION]
- Real-time feedback for development

### 2. Production Mode

- Server name: '@aindreyway/mcp-neurolora'
- Clean, professional output
- No debug information
- Automatic updates via npx
- Global installation support

## Core Components

### 1. Code Analysis System

- OpenAI API integration
- Structured analysis output
- Token counting and management
- Progress tracking
- GitHub issues format support

### 2. Code Collection System

- Recursive directory traversal
- Pattern-based file filtering
- Programming language detection by extension
- Various encodings handling

### 3. Tools

#### analyze_code

Main tool for code analysis

- Parameters:
  - codePath: Path to code for analysis
- Features:
  - OpenAI API integration
  - Structured feedback
  - GitHub issues generation
  - Progress tracking

#### collect_code

Code collection tool

- Parameters:
  - directory: Path to code directory
  - outputPath: Path for saving output
  - ignorePatterns: Patterns for ignoring files

#### install_base_servers

Tool for automatic installation of base MCP servers

- Parameters:
  - configPath: Path to MCP settings configuration file
- Installs:
  - fetch: Basic HTTP request functionality
  - puppeteer: Browser automation capabilities
  - sequential-thinking: Advanced problem-solving tools
  - github: GitHub integration features
  - git: Git operations support
  - shell: Basic shell command execution

## Development Workflow

### Local Development Setup

1. Environment Configuration:

   ```bash
   # Copy environment template
   cp .env.example .env

   # Configure environment
   MCP_ENV=local
   OPENAI_API_KEY=your_key_here
   STORAGE_PATH=data
   ```

2. Development Scripts:

   ```bash
   # Run in local mode
   npm run local

   # Build in local mode
   npm run local:build

   # Start built version in local mode
   npm run local:start
   ```

3. Development Cycle:

   - Stop all running processes:

     ```bash
     # Find all Node.js processes
     ps aux | grep node

     # Kill specific process
     kill -9 [PID]

     # Or kill all Node.js processes (use with caution)
     pkill -f node
     ```

   - Edit source files
   - Run `npm run local:build`
   - Test with `npm run local:start`
   - Check output in project root

   > **Important**: Always stop all running Node.js processes before rebuilding and starting the local server. Multiple instances of the server can cause conflicts and unexpected behavior.

### Production Deployment

1. Prepare for Release:

   ```bash
   # Update version
   npm version patch  # or minor/major

   # Build and publish
   npm run build
   npm publish --access public

   # Update repository
   git push --tags
   git push
   ```

## Technical Details

### Configuration System

The project uses a centralized configuration system (`src/config/index.ts`) that manages all configurable parameters:

- File System Configuration:

  - Maximum file size (1MB)
  - Default ignore patterns
  - Maximum recursion depth
  - Regex timeout settings

- OpenAI Configuration:
  - Maximum tokens limit
  - Model selection
  - Request timeout settings

### Security Features

- Protection against ReDoS attacks:

  - Pattern sanitization
  - Regex execution timeouts
  - Worker-based pattern matching

- Symlink Protection:

  - Cycle detection
  - Path tracking
  - Maximum recursion limits

- Sensitive Data Protection:
  - Extended ignore patterns for sensitive files
  - Path sanitization in error messages
  - Environment variable protection

### Error Handling

- Specific error types for different scenarios:

  - GitHub API errors (auth, rate limit, permissions)
  - File system errors
  - Validation errors

- Async operation safety:
  - Resource cleanup
  - Timeout handling
  - Progress tracking

### File Processing

- Maximum file size: 1MB
- Encoding: UTF-8
- Support for multiple programming languages
- Binary files handling
- Safe symlink traversal

### Configuration

```json
{
  "command": "npx",
  "args": ["-y", "@aindreyway/mcp-neurolora@latest"],
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=256"
  }
}
```

## Development Process

### MCP Commands Debug

For debugging MCP commands, you can run them directly through the CLI:

```bash
# Build and run a command
npm run build && DEBUG=* node build/index.js [command] [args]

# Example: Analyze code
npm run build && DEBUG=* node build/index.js analyze_code --input /path/to/code --output /path/to/output

# Example: Install base servers
npm run build && DEBUG=* node build/index.js install_base_servers --config /path/to/config.json
```

This allows you to:

- See detailed debug output with DEBUG=\*
- Test commands without going through Claude
- Quickly iterate on fixes
- Verify command behavior in isolation

### Current Tasks

- Large projects processing optimization
- Programming language detection improvements
- File format support expansion
- Base servers configuration management
- Installation process automation

### Future Improvements

- Code statistics generation
- Dependency graph visualization
- Documentation systems integration

## Deployment and Versioning

### Automated Version Management

The project uses an automated versioning system that ensures all version references are automatically updated during the release process. This is handled by the update-version.js script:

```javascript
#!/usr/bin/env node
import fs from 'fs/promises';

// Read version from package.json (source of truth)
const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
const version = packageJson.version;

// Define files that need version updates
const filesToUpdate = [
  {
    path: 'README.md',
    pattern: /!\[Version\]\(.*version-[\d\.]+/g,
    replace: `![Version](https://img.shields.io/badge/version-${version}`,
  },
  {
    path: 'src/server.ts',
    pattern: /version: '[\d\.]+'/g,
    replace: `version: '${version}'`,
  },
];

// Update versions in all files
for (const file of filesToUpdate) {
  const content = await fs.readFile(file.path, 'utf8');
  const updatedContent = content.replace(file.pattern, file.replace);
  await fs.writeFile(file.path, updatedContent, 'utf8');
}
```

This script is integrated into the npm workflow:

```json
{
  "scripts": {
    "update-version": "node scripts/update-version.js",
    "version": "npm run update-version && git add -A",
    "prepublishOnly": "npm run build"
  }
}
```

### One-Command Deployment

The entire deployment process is automated through a single command that handles building, versioning, and publishing:

```bash
npm run build && git add . && git commit -m "type: description of changes

- Change 1
- Change 2" && npm version minor && npm publish --access public && git push --tags && git push
```

This command sequence:

1. ✅ Builds the project
2. ✅ Stages all changes
3. ✅ Creates a commit with a descriptive message
4. ✅ Updates version numbers automatically in all files
5. ✅ Creates a git tag
6. ✅ Publishes to npm
7. ✅ Updates the repository

### Deployment Verification

After running the deployment command, you should see these success indicators:

1. Version Updates:

   ```
   ✅ Updated version in README.md
   ✅ Updated version in src/server.ts
   🎉 Version X.Y.Z updated in all files
   ```

2. npm Publishing:

   ```
   ✅ @aindreyway/mcp-neurolora@X.Y.Z
   + @aindreyway/mcp-neurolora@X.Y.Z
   ```

3. Git Updates:
   ```
   ✅ [main XXXXXXX] type: description of changes
   ✅ * [new tag] vX.Y.Z -> vX.Y.Z
   ```

### Post-Deployment Checklist

Verify these items after deployment:

1. Package Registry:

   - [ ] Package visible on npm
   - [ ] Correct version number
   - [ ] All files included

2. GitHub Repository:

   - [ ] New version tag present
   - [ ] Code changes visible
   - [ ] Version numbers updated

3. Installation Test:
   ```bash
   npx -y @aindreyway/mcp-neurolora@latest
   # Should show:
   ✅ Successfully installed
   ✅ Server running
   ```

### Version Numbering

Follow Semantic Versioning:

- MAJOR (x.0.0): Breaking changes
- MINOR (0.x.0): New features (backward compatible)
- PATCH (0.0.x): Bug fixes

### Best Practices

1. Always use the one-command deployment
2. Check all success indicators
3. Complete post-deployment checklist
4. Document significant changes

5. Version Control:

   - Keep main branch stable
   - Use feature branches
   - Clean commits

6. Documentation:

   - Update README.md
   - Update PROJECT_SUMMARY.md
   - Document breaking changes

7. Testing:

   - Test in both modes (local/production)
   - Verify all tools
   - Check version consistency

8. Release Notes:
   - Clear commit messages
   - Documented changes
   - Upgrade instructions

This automated process ensures:

- Consistent versioning across all files
- Reliable deployment workflow
- Proper documentation updates
- Clean git history

## Project Structure

```
src/
├── index.ts         # Entry point
├── server.ts        # Main server class
├── types/           # Types and interfaces
├── utils/           # File handling utilities
└── validators/      # Input parameter validation
```

## Implementation Details

- Promise-based async operations
- Efficient memory management
- Modular architecture for easy extension
- Detailed error logging

## Memory Management

- Limited heap size (256MB)
- Streaming for large files
- Automatic cleanup
- File size limits

## Error Handling

- Detailed error messages
- Graceful failure handling
- Input validation
- File system error handling

## Testing Strategy

- Unit tests for core functionality
- Integration tests for file operations
- Memory usage monitoring
- Performance benchmarks
