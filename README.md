# Markdown Backlog Converter MCP
[日本語のREADMEはこちら](README.ja.md)

This project provides a Model Context Protocol (MCP) server that converts Markdown into Backlog wiki notation. It exposes a single tool, `markdown_to_backlog`, which can be accessed from MCP-compatible clients such as Cursor, Claude Code, or the MCP Inspector.

## Features
- Converts Markdown strings to Backlog notation using the `md2bg` library
- Runs as an MCP stdio server, making it easy to integrate into local development tools
- Includes automated tests that verify conversion accuracy with sample fixtures

## Installation
```bash
npm install -g markdown-backlog-converter-mcp
```

Or run via `npx` without a global install:
```bash
npx markdown-backlog-converter-mcp
```

## MCP Configuration Examples
Add the server to your `mcp.json` (or Cursor/Claude configuration) using one of the following recipes.

### Local build
If you prefer running your own build, set things up like so (replace the paths with your environment):

1. Clone and enter the repository:

```bash
git clone git@github.com:tominaga-h/markdown-backlog-converter-mcp.git
cd markdown-backlog-converter-mcp
```

2. Install dependencies and build the server:

```bash
npm install
npm run build
```

3. Register the built server in `mcp.json`:

```json
{
  "markdown-to-backlog": {
    "command": "node",
    "args": ["/<path to repo>/markdown-backlog-converter-mcp/dist/server.js"]
  }
}
```

### Via npx

```json
{
  "markdown-to-backlog": {
    "command": "npx",
    "args": ["markdown-backlog-converter-mcp"]
  }
}
```

## Usage
After installation, configure your MCP-compatible client with the stdio command `markdown-backlog-converter-mcp`. The server registers a single tool:

| Tool Name | Description | Input | Output |
|-----------|-------------|-------|--------|
| `markdown_to_backlog` | Converts Markdown text to Backlog wiki notation | `{ "markdown": string }` | `{ "backlog": string }` |

Clients can call this tool by passing Markdown text as the `markdown` argument. The response includes both plain text content and structured data containing the Backlog-formatted result.

## Development
```bash
npm install
npm run build
npm test
```

The entrypoint is located at `src/server.ts`, which exports both a reusable `createServer()` factory and a CLI entry point exposed via `bin`.

## License
MIT
