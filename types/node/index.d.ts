declare namespace NodeJS {
  interface ReadableStream {
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  interface WritableStream {
    write(buffer: string | Uint8Array): boolean;
  }
}

declare const process: {
  stdin: NodeJS.ReadableStream;
  stdout: NodeJS.WritableStream;
  argv: string[];
  env: Record<string, string | undefined>;
  exitCode?: number;
  exit(code?: number): never;
};

declare function require(id: string): any;

type NodeRequire = (id: string) => any;

declare module "node:module" {
  function createRequire(url: string): NodeRequire;
  export { createRequire };
}

declare module "node:readline" {
  interface ReadLine {
    on(event: "line", listener: (input: string) => void): this;
  }

  interface ReadLineOptions {
    input: NodeJS.ReadableStream;
    crlfDelay?: number;
  }

  function createInterface(options: ReadLineOptions): ReadLine;

  export { createInterface };
}

declare module "node:assert/strict" {
  export function equal(actual: unknown, expected: unknown, message?: string): void;
  export function match(actual: string, regExp: RegExp, message?: string): void;
  export function ok(value: unknown, message?: string): asserts value;
}
