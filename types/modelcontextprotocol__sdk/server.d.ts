export interface ServerOptions {
  name: string;
  version: string;
}

export interface ToolDefinition<Input = unknown> {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

export interface ToolResponseContent {
  type: string;
  text?: string;
  [key: string]: unknown;
}

export interface ToolResponse {
  content: ToolResponseContent[];
  [key: string]: unknown;
}

export interface ToolInvocationContext {
  [key: string]: unknown;
}

export type ToolHandler<Input = unknown> = (
  input: Input,
  context: ToolInvocationContext,
) => Promise<ToolResponse> | ToolResponse;

export interface ServerTransport {
  connect(server: Server): Promise<void>;
}

export class Server {
  constructor(options: ServerOptions);

  addTool<Input = unknown>(
    definition: ToolDefinition<Input>,
    handler: ToolHandler<Input>,
  ): void;

  connect(transport: ServerTransport): Promise<void>;
}
