#!/usr/bin/env node
// 把仓库根 VERSION 的版本号同步到五个随插件分发的清单文件。
// 取代 tools/generate.mjs 的清单盖章职责：汉化后生成器无法解析中文标题，
// 版本同步由本脚本独立完成。pre-commit 钩子与手动发版都走这里。
//
// 用法：
//   node scripts/sync-plugin-version.mjs          同步 VERSION -> 各清单
//   node scripts/sync-plugin-version.mjs --check  只校验，不一致时退出码 1

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");

const versionFiles = [
  "package.json",
  ".claude-plugin/marketplace.json",
  "plugins/pstack/.claude-plugin/plugin.json",
  "plugins/pstack/.codex-plugin/plugin.json",
  "plugins/pstack/.github/plugin/plugin.json",
];

const version = readFileSync(join(repo, "VERSION"), "utf8").trim();
let drifted = false;

for (const rel of versionFiles) {
  const path = join(repo, rel);
  const source = readFileSync(path, "utf8");
  const match = source.match(/"version":\s*"([^"]+)"/);
  if (!match) {
    console.error(`${rel}: 找不到 "version" 字段`);
    process.exit(1);
  }
  if (match[1] === version) continue;
  drifted = true;
  if (check) {
    console.error(`${rel}: 版本为 ${match[1]}，VERSION 为 ${version}。运行 node scripts/sync-plugin-version.mjs`);
    continue;
  }
  // 只替换版本行，保留键序与格式。
  writeFileSync(
    path,
    source.replace(/("version":\s*)"[^"]+"/, `$1"${version}"`),
  );
  console.log(`${rel}: ${match[1]} -> ${version}`);
}

if (check && drifted) process.exit(1);
if (!check && !drifted) console.log(`所有清单已与 VERSION 一致：${version}`);
