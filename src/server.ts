#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/transports/stdio";

import { convertMarkdownToBacklog } from "./converter";

const serverInfo = {
  name: "markdown-backlog-converter-mcp",
  version: "0.1.0",
} as const;

type MarkdownToolInput = {
  markdown?: unknown;
};

function parsePort(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 65535) {
    return parsed;
  }

  return undefined;
}

function detectListenPort(): number | undefined {
  const args = process.argv.slice(2);
  const argPort = args
    .map((arg: string, index: number, all: string[]) => {
      if (arg === "--port" || arg === "-p") {
        return all[index + 1];
      }

      const match = arg.match(/^--port=(.+)$/);
      if (match) {
        return match[1];
      }

      const shortMatch = arg.match(/^-p(.+)$/);
      if (shortMatch) {
        return shortMatch[1];
      }

      return undefined;
    })
    .find((candidate): candidate is string => typeof candidate === "string");

  const port =
    parsePort(argPort) ??
    parsePort(process.env.MCP_SERVER_PORT) ??
    parsePort(process.env.MCP_PORT) ??
    parsePort(process.env.PORT);

  return port;
}

const configuredPort = detectListenPort();

if (configuredPort !== undefined) {
  console.error(`MCP サーバーをポート ${configuredPort} で待機します。`);
} else {
  console.error("MCP サーバーは標準入力/標準出力で待機します。");
}

function resolveMarkdown(input: MarkdownToolInput): string {
  if (typeof input?.markdown === "string") {
    return input.markdown;
  }

  return "";
}

async function main(): Promise<void> {
  const server = new Server(serverInfo);

  server.addTool(
    {
      name: "markdown-to-backlog",
      description:
        "利用可能であれば md2bg ライブラリを使って Markdown を Backlog のWiki記法に変換します。",
      inputSchema: {
        type: "object",
        properties: {
          markdown: {
            type: "string",
            description: "Backlog 記法に変換したい Markdown テキスト。",
          },
        },
        required: ["markdown"],
      },
    },
    async (input: MarkdownToolInput) => {
      try {
        const converted = convertMarkdownToBacklog(resolveMarkdown(input));
        return {
          content: [
            {
              type: "text",
              text: converted,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Markdown から Backlog への変換に失敗しました。\n理由: ${message}`,
        );
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`MCP サーバーの起動に失敗しました: ${message}`);
  process.exitCode = 1;
});
