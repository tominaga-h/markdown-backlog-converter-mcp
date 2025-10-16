#!/usr/bin/env node

import { createInterface } from "node:readline";
import { convertMarkdownToBacklog } from "./converter";

type JsonRpcId = number | string | null;

type JsonRpcParams = Record<string, unknown>;

type ToolCallParams = {
  name?: string;
  arguments?: Record<string, unknown>;
};

interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: {
      markdown: {
        type: "string";
        description: string;
      };
    };
    required: ["markdown"];
  };
}

interface JsonRpcRequest {
  id?: JsonRpcId;
  method?: string;
  params?: JsonRpcParams;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: JsonRpcError;
}

const serverInfo = {
  name: "markdown-backlog-converter-mcp",
  version: "0.1.0",
} as const;

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

const tools: Record<string, ToolDefinition> = {
  "markdown-to-backlog": {
    name: "markdown-to-backlog",
    description:
      "利用可能であれば md2bg ライブラリを使って Markdown を Backlog のWiki記法に変換します。",
    input_schema: {
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
};

function sendResponse(message: JsonRpcResponse): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handleToolCall(params: JsonRpcParams, id: JsonRpcId): Promise<void> {
  const { name, arguments: args = {} } = params as ToolCallParams;

  if (typeof name !== "string" || !tools[name]) {
    sendResponse({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32602,
        message: `不明なツールです: ${String(name)}`,
      },
    });
    return;
  }

  const markdown = typeof args.markdown === "string" ? args.markdown : "";

  try {
    const result = convertMarkdownToBacklog(markdown);
    sendResponse({
      jsonrpc: "2.0",
      id,
      result: {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendResponse({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32001,
        message: "Markdown から Backlog への変換に失敗しました。",
        data: {
          message,
        },
      },
    });
  }
}

function handleMessage(line: string): void {
  if (!line.trim()) {
    return;
  }

  let message: JsonRpcRequest;
  try {
    message = JSON.parse(line) as JsonRpcRequest;
  } catch (error) {
    const parseMessage = error instanceof Error ? error.message : String(error);
    sendResponse({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "JSON の解析に失敗しました。",
        data: {
          input: line,
          message: parseMessage,
        },
      },
    });
    return;
  }

  const { id = null, method, params = {} } = message;

  if (typeof method !== "string") {
    sendResponse({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32600,
        message: "無効なリクエストです: method は文字列である必要があります。",
      },
    });
    return;
  }

  switch (method) {
    case "initialize": {
      sendResponse({
        jsonrpc: "2.0",
        id,
        result: {
          serverInfo,
          capabilities: {
            tools: Object.fromEntries(
              Object.values(tools).map((tool) => [tool.name, tool])
            ),
          },
        },
      });
      break;
    }
    case "ping": {
      sendResponse({
        jsonrpc: "2.0",
        id,
        result: { ok: true },
      });
      break;
    }
    case "tools/list": {
      sendResponse({
        jsonrpc: "2.0",
        id,
        result: {
          tools: Object.values(tools),
        },
      });
      break;
    }
    case "tools/call": {
      void handleToolCall(params, id);
      break;
    }
    case "shutdown": {
      sendResponse({
        jsonrpc: "2.0",
        id,
        result: null,
      });
      break;
    }
    case "exit": {
      process.exit(0);
      break;
    }
    default: {
      if (id !== null) {
        sendResponse({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `未対応のメソッドです: ${method}`,
          },
        });
      }
    }
  }
}

const rl = createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

rl.on("line", handleMessage);

process.stdin.on("end", () => {
  process.exit(0);
});
