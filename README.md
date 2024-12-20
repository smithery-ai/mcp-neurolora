# MCP Neurolora

![MCP Server](https://img.shields.io/badge/MCP-Server-blue)
![Version](https://img.shields.io/badge/version-1.2.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

An intelligent MCP server that provides tools for installing base MCP servers and collecting code from directories.

## 🚀 Installation Guide

Don't worry if you don't have anything installed yet! Just follow these steps or ask your assistant to help you with the installation.

### Step 1: Install Node.js

#### macOS

1. Install Homebrew if not installed:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Install Node.js 18:
   ```bash
   brew install node@18
   echo 'export PATH="/opt/homebrew/opt/node@18/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

#### Windows

1. Download Node.js 18 LTS from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. Open a new terminal to apply changes

#### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Install uv and uvx

#### All Operating Systems

1. Install uv:

   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. Install uvx:
   ```bash
   uv pip install uvx
   ```

### Step 3: Verify Installation

Run these commands to verify everything is installed:

```bash
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
uv --version    # Should show uv installed
uvx --version   # Should show uvx installed
```

### Step 4: Configure MCP Server

Your assistant will help you:

1. Find your Cline settings file:

   - VSCode: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
   - Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows VSCode: `%APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
   - Windows Claude: `%APPDATA%/Claude/claude_desktop_config.json`

2. Add this configuration:
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

### Step 5: Install Base Servers

Simply ask your assistant:
"Please install the base MCP servers for my environment"

Your assistant will:

1. Find your settings file
2. Run the install_base_servers tool
3. Configure all necessary servers automatically

> **Note:** This server uses `npx` for direct npm package execution, which is optimal for Node.js/TypeScript MCP servers, providing seamless integration with the npm ecosystem and TypeScript tooling.

## Base MCP Servers

The following base servers will be automatically installed and configured:

- fetch: Basic HTTP request functionality for accessing web resources
- puppeteer: Browser automation capabilities for web interaction and testing
- sequential-thinking: Advanced problem-solving tools for complex tasks
- github: GitHub integration features for repository management
- git: Git operations support for version control
- shell: Basic shell command execution with common commands:
  - ls: List directory contents
  - cat: Display file contents
  - pwd: Print working directory
  - grep: Search text patterns
  - wc: Count words, lines, characters
  - touch: Create empty files
  - find: Search for files

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
