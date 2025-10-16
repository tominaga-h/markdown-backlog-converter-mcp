import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let libraryConverter: ((markdown: string) => string) | undefined;
let libraryLoadError: unknown;

type Md2BgModule = {
  default?: (markdown: string) => string;
};

type MaybeConverter = ((markdown: string) => string) | Md2BgModule | undefined;

try {
  // `md2bg` は CommonJS で関数を直接 export しているケースと、default export を
  // 利用しているケースがあるため、両方を考慮して関数を取得する。
  const requiredModule: MaybeConverter = require("md2bg");

  if (typeof requiredModule === "function") {
    libraryConverter = requiredModule;
  } else if (
    requiredModule &&
    typeof requiredModule === "object" &&
    typeof requiredModule.default === "function"
  ) {
    libraryConverter = requiredModule.default;
  }
} catch (error) {
  libraryLoadError = error;
}

export function fallbackConverter(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .map((block) => {
      if (!block) {
        return "";
      }

      if (/^#{1,6} /.test(block)) {
        const headingMatch = block.match(/^#{1,6}/);
        const level = headingMatch ? headingMatch[0].length : 1;
        const heading = block.replace(/^#{1,6}\s*/, "").trim();
        return `[h${level}] ${heading}`;
      }

      if (/^```/.test(block)) {
        const lines = block.split(/\n/);
        const code = lines.slice(1, -1).join("\n");
        return `{{{\n${code}\n}}}`;
      }

      if (/^\*\s+/.test(block) || /^-\s+/.test(block)) {
        return block
          .split(/\n/)
          .map((line) => line.replace(/^[*-]\s+/, "* "))
          .join("\n");
      }

      if (/^\d+\.\s+/.test(block)) {
        return block
          .split(/\n/)
          .map((line) => line.replace(/^(\d+)\.\s+/, "$1. "))
          .join("\n");
      }

      const boldSegments: string[] = [];

      let transformed = block.replace(/\*\*(.+?)\*\*/g, (_match, content) => {
        boldSegments.push(content as string);
        return `§§BOLD:${boldSegments.length - 1}§§`;
      });

      transformed = transformed.replace(/__(.+?)__/g, (_match, content) => {
        boldSegments.push(content as string);
        return `§§BOLD:${boldSegments.length - 1}§§`;
      });

      transformed = transformed
        .replace(/\*(.+?)\*/g, (_match, content) => `+ ${content as string} +`)
        .replace(/_(.+?)_/g, (_match, content) => `+ ${content as string} +`)
        .replace(/`([^`]+)`/g, "{{ $1 }}");

      return transformed.replace(/§§BOLD:(\d+)§§/g, (_match, index) => {
        const boldContent = boldSegments[Number(index)] ?? "";
        return `* ${boldContent} *`;
      });
    })
    .join("\n\n");
}

export function convertMarkdownToBacklog(markdown: string): string {
  if (libraryConverter) {
    return libraryConverter(markdown);
  }

  const messageParts = [
    "md2bg ライブラリを読み込めなかったため、フォールバックの変換処理を利用します。",
  ];

  if (libraryLoadError) {
    const reason =
      libraryLoadError instanceof Error
        ? libraryLoadError.message
        : String(libraryLoadError);
    messageParts.push(`理由: ${reason}`);
  }

  return `${messageParts.join(" \n")}\n\n${fallbackConverter(markdown)}`;
}
