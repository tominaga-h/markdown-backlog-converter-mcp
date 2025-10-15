import assert from "node:assert/strict";
import { fallbackConverter, convertMarkdownToBacklog } from "../dist/converter";

interface TestCase {
  name: string;
  run: () => void;
}

const tests: TestCase[] = [];

function test(name: string, run: () => void): void {
  tests.push({ name, run });
}

test("fallbackConverter は見出し記法を Backlog 記法に変換する", () => {
  const markdown = "# タイトル\n\n## サブタイトル";
  const converted = fallbackConverter(markdown);

  assert.equal(converted, "[h1] タイトル\n\n[h2] サブタイトル");
});

test("fallbackConverter は箇条書き記法を Backlog 記法に変換する", () => {
  const markdown = "- りんご\n- みかん\n- ぶどう";
  const converted = fallbackConverter(markdown);

  assert.equal(converted, "* りんご\n* みかん\n* ぶどう");
});

test("fallbackConverter はインライン装飾を Backlog 記法に変換する", () => {
  const markdown = "**太字** と *斜体* と `コード`";
  const converted = fallbackConverter(markdown);

  assert.equal(converted, "* 太字 * と + 斜体 + と {{ コード }}");
});

test("convertMarkdownToBacklog は md2bg が読み込めない場合にフォールバックする", () => {
  const markdown = "# 見出し";
  const converted = convertMarkdownToBacklog(markdown);

  assert.match(
    converted,
    /^The md2bg library could not be loaded. Fallback conversion is being used.\s+Reason:/
  );
  assert.ok(converted.includes("[h1] 見出し"));
});

let hasFailure = false;

for (const currentTest of tests) {
  try {
    currentTest.run();
    console.log(`✓ ${currentTest.name}`);
  } catch (error) {
    hasFailure = true;
    console.error(`✗ ${currentTest.name}`);
    console.error(error);
  }
}

if (hasFailure) {
  process.exitCode = 1;
} else {
  console.log(`${tests.length} 件のテストが成功しました`);
}
