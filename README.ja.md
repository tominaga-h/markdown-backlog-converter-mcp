# Markdown Backlog Converter MCP

このプロジェクトは Markdown を Backlog のウィキ記法へ変換する Model Context Protocol (MCP) サーバーです。`markdown_to_backlog` というツールを提供し、Cursor や Claude Code、MCP Inspector などの MCP 対応クライアントから利用できます。

## 特長
- `md2bg` ライブラリを利用して Markdown 文字列を Backlog 記法へ変換
- MCP の stdio サーバーとして動作するため、ローカル開発ツールとの連携が簡単
- サンプルフィクスチャを用いた自動テストで変換結果の正確性を検証

## インストール
```bash
npm install -g markdown-backlog-converter-mcp
```

グローバルインストールせずに `npx` から直接実行することもできます。
```bash
npx markdown-backlog-converter-mcp
```

## 使い方
インストール後、MCP 対応クライアントに `markdown-backlog-converter-mcp`（stdio コマンド）を登録してください。サーバーは次のツールを提供します。

| ツール名 | 説明 | 入力 | 出力 |
|---------|------|------|------|
| `markdown_to_backlog` | Markdown テキストを Backlog のウィキ記法へ変換 | `{ "markdown": string }` | `{ "backlog": string }` |

クライアントは `markdown` 引数に Markdown テキストを渡すことでツールを呼び出せます。レスポンスには、変換結果のテキストと構造化データの両方が含まれます。

## 開発
```bash
npm install
npm run build
npm test
```

エントリーポイントは `src/server.ts` にあり、再利用可能な `createServer()` ファクトリと CLI エントリポイントの両方を公開しています。

## ライセンス
MIT

