import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { createServer } from '../src/server';

type RegisteredTool = {
  callback: (args: { markdown: string }, extra: unknown) => Promise<{
    content: Array<{ type: string; text: string }>;
    structuredContent: { backlog: string };
  }>;
};

function getMarkdownToBacklogTool() {
  const server = createServer();
  const registry = (server as unknown as { _registeredTools: Record<string, RegisteredTool> })
    ._registeredTools;
  const tool = registry['markdown_to_backlog'];
  assert.ok(tool, 'markdown_to_backlog tool should be registered');
  return tool;
}

test('markdown_to_backlog converts heading markup', async () => {
  const tool = getMarkdownToBacklogTool();
  const result = await tool.callback({ markdown: '# Title' }, {});

  assert.equal(result.structuredContent.backlog, '* Title');
  assert.equal(result.content[0]?.text, '* Title');
});

test('markdown_to_backlog converts complex markdown sample', async () => {
  const tool = getMarkdownToBacklogTool();
  const markdownPath = path.join(__dirname, '..', 'test.md');
  const backlogPath = path.join(__dirname, '..', 'test_backlog.txt');

  const [markdown, expectedBacklog] = await Promise.all([
    fs.readFile(markdownPath, 'utf-8'),
    fs.readFile(backlogPath, 'utf-8')
  ]);

  const result = await tool.callback({ markdown }, {});
  assert.equal(result.structuredContent.backlog.trim(), expectedBacklog.trim());
});

