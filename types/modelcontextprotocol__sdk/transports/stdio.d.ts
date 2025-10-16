import type { ServerTransport } from "../server";

export class StdioServerTransport implements ServerTransport {
  constructor();
  connect: ServerTransport["connect"];
}
