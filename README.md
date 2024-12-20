# MCP Neurolora

![MCP Server](https://img.shields.io/badge/MCP-Server-blue)
![Version](https://img.shields.io/badge/version-1.2.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

An intelligent MCP server that provides tools for installing base MCP servers and collecting code from directories.

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

After adding the configuration, ask your assistant to:

1. Install base MCP servers by running the `install_base_servers` tool
2. The tool will automatically add all necessary base servers to your configuration

> **Note:** This server uses `npx` for direct npm package execution, which is optimal for Node.js/TypeScript MCP servers, providing seamless integration with the npm ecosystem and TypeScript tooling.

## Base MCP Servers

The following base servers will be installed:

- fetch: Basic HTTP request functionality
- puppeteer: Browser automation capabilities
- sequential-thinking: Advanced problem-solving tools
- github: GitHub integration features
- git: Git operations support
- shell: Basic shell command execution with common commands (ls, cat, pwd, grep, wc, touch, find)

## 🎯 What Your Assistant Can Do

Ask your assistant to:

- "Install base MCP servers for my environment"
- "Collect code from my project directory"
- "Create documentation for my codebase"
- "Generate a markdown file with all my code"
- "Export my project files with syntax highlighting"

## 🛠 Available Tools

### install_base_servers

Installs base MCP servers to your configuration file. This tool helps set up essential MCP servers for your environment.

Parameters:

- `configPath` (required): Path to the MCP settings configuration file

Example usage:

```json
{
  "configPath": "/path/to/cline_mcp_settings.json"
}
```

The tool will install the following base servers if they're not already present:

- fetch: Basic HTTP request functionality
- puppeteer: Browser automation capabilities
- sequential-thinking: Advanced problem-solving tools
- github: GitHub integration features
- git: Git operations support
- shell: Basic shell command execution

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

Important: Always specify the outputPath to save the file inside the directory being collected. For example:

```json
{
  "directory": "/path/to/project/src",
  "outputPath": "/path/to/project/src/FULL_CODE_SRC_2024-12-20.md",
  "ignorePatterns": ["*.log", "temp/", "__pycache__", "*.pyc", ".git"]
}
```

This ensures that the documentation is kept alongside the code it documents. The file name should follow the format `FULL_CODE_DIRNAME_YYYY-MM-DD.md`, where:

- DIRNAME is the uppercase name of your input directory
- YYYY-MM-DD is the current date

Always use absolute paths to ensure reliable operation in any environment.

The tool will collect all code files from the specified directory, ignoring any files that match the patterns, and create a markdown file with syntax highlighting and navigation.

## 🔧 Features

The server automatically:

- Installs and configures base MCP servers
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
