# MCP Neurolora

![MCP Server](https://img.shields.io/badge/MCP-Server-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

An intelligent MCP server that provides tools for collecting and documenting code from directories, creating comprehensive markdown files with syntax highlighting and navigation.

## 🚀 Quick Start

### Prerequisites

1. Make sure you have Node.js installed (version 18 or higher):

   ```bash
   node --version
   ```

2. Install or update npm (comes with Node.js):

   ```bash
   npm install -g npm@latest
   ```

3. Verify npx is available:
   ```bash
   npx --version
   ```
   If not found, install it:
   ```bash
   npm install -g npx
   ```

### Configuration

Add this to your Cline/Sonnet configuration:

```json
"aindreyway-mcp-neurolora": {
  "command": "npx",
  "args": ["-y", "--node-arg=--max-old-space-size=256", "@aindreyway/mcp-neurolora@latest"],
  "disabled": false,
  "env": {}
}
```

That's it! The assistant will handle everything automatically.

> **Note:** This server uses `npx` for direct npm package execution, which is optimal for Node.js/TypeScript MCP servers, providing seamless integration with the npm ecosystem and TypeScript tooling.

## 🎯 What Your Assistant Can Do

Ask your assistant to:

- "Collect code from my project directory"
- "Create documentation for my codebase"
- "Generate a markdown file with all my code"
- "Export my project files with syntax highlighting"

## 🛠 Available Tools

### collect_code

Collects all code from a directory into a single markdown file with syntax highlighting and navigation.

Parameters:

- `directory` (required): Directory path to collect code from
- `outputPath` (required): Path where to save the output markdown file
- `ignorePatterns` (optional): Array of patterns to ignore (similar to .gitignore)

Example usage:

```typescript
await use_mcp_tool({
  server_name: 'aindreyway-mcp-neurolora',
  tool_name: 'collect_code',
  arguments: {
    directory: '/path/to/project',
    outputPath: '/path/to/output.md',
    ignorePatterns: ['*.log', 'temp/'],
  },
});
```

## 🔧 Features

The server automatically:

- Collects code from specified directories
- Generates well-formatted markdown documentation
- Supports syntax highlighting for various programming languages
- Creates table of contents with anchors
- Handles large codebases efficiently:
  - Memory-efficient file processing
  - Configurable file size limits
  - Smart file filtering
  - Limited heap size (256MB)
- Provides flexible ignore patterns
- Supports UTF-8 encoding

## 📝 License

MIT License - feel free to use this in your projects!

## 👤 Author

**Aindreyway**

- GitHub: [@aindreyway](https://github.com/aindreyway)

## ⭐️ Support

Give a ⭐️ if this project helped you!
