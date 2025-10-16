#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { md2bg } from 'md2bg';
import { z } from 'zod';
import pkg from '../package.json';

/** Build a configured MCP server instance. */
export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: 'markdown-backlog-converter',
      version: pkg.version ?? '0.0.0'
    },
    {
      capabilities: {}
    }
  );

  server.registerTool(
    'markdown_to_backlog',
    {
      title: 'Markdown to Backlog',
      description: 'Convert Markdown formatted text to Backlog wiki notation.',
      inputSchema: {
        markdown: z.string().describe('Markdown text to convert to Backlog notation.')
      },
      outputSchema: {
        backlog: z.string().describe('Converted Backlog formatted text.')
      }
    },
    async ({ markdown }) => {
      try {
        const backlog = md2bg(markdown, false);

        return {
          content: [
            {
              type: 'text',
              text: backlog
            }
          ],
          structuredContent: {
            backlog
          }
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error while converting Markdown.';
        throw new Error(`Failed to convert Markdown to Backlog notation: ${message}`);
      }
    }
  );

  return server;
}

export async function startServer(): Promise<McpServer> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}

if (require.main === module) {
  startServer().catch(error => {
    // Ensure failures are visible to the host process
    console.error(error);
    process.exitCode = 1;
  });
}
