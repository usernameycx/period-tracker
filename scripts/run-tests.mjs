#!/usr/bin/env node
/**
 * 跨平台测试入口。
 *
 * 为什么不用 `tsx --test "tests/**\/*.test.ts"`：
 *   1. Linux 的 sh 会提前展开未加引号的 glob，`**` 在未开 globstar 时等价于 `*`，
 *      匹配不到直接放在 tests/ 下的文件，最后把字面量传给测试运行器 → 找不到用例。
 *   2. Node 20 的 `--test` 不接受 glob 字面量（Node 22+ 才支持），
 *      所以 CI 用 Node 20 时同样会失败。
 *
 * 这里直接用 fs 列出用例文件再交给 `node --import tsx --test`，
 * 不依赖 shell 展开、也不依赖 Node 版本的 glob 支持。
 */
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const testsDir = join(root, 'tests');

const files = readdirSync(testsDir, { recursive: true })
  .map(f => String(f))
  .filter(f => f.endsWith('.test.ts') || f.endsWith('.test.tsx'))
  .sort()
  .map(f => relative(root, join(testsDir, f)));

if (files.length === 0) {
  console.error('未找到任何测试文件（tests/**/*.test.ts）');
  process.exit(1);
}

console.log(`运行 ${files.length} 个测试文件：\n  ${files.join('\n  ')}\n`);

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', ...files],
  { stdio: 'inherit', cwd: root }
);

process.exit(result.status ?? 1);
