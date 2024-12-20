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
  "args": ["-y", "@aindreyway/mcp-neurolora@latest"],
  "disabled": false,
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=256"
  }
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
- `outputPath` (optional): Path where to save the output markdown file
- `ignorePatterns` (optional): Array of patterns to ignore (similar to .gitignore)

Example usage:

Simply provide the arguments in JSON format:

```json
{
  "directory": "/path/to/project",
  "ignorePatterns": ["*.log", "temp/", "__pycache__", "*.pyc", ".git"]
}
```

Note: If outputPath is not provided, the file will be automatically saved in the current working directory with the name `FULL_CODE_DIRNAME.md`, where DIRNAME is the uppercase name of your input directory.

For security reasons, files can only be written to:

- Your home directory and its subdirectories
- System temporary directory
- Current working directory

If you specify a path outside these locations, the operation will fail with an "Access denied" error.

The tool will collect all code files from the specified directory, ignoring any files that match the patterns, and create a markdown file with syntax highlighting and navigation.

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
