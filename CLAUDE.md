# 仓库约定

本仓库是 [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude) 的第三方简体中文汉化版。改这个仓库之前，先读这几条。

## 定位与安装命令

- 本仓库由 `9018447` 维护。提及英文上游时必须明确标注，**中文版安装命令必须指向 `9018447/pstack-claude`**，不得把上游命令（`michael-denyer/pstack-claude`）用作中文版的默认安装命令。安装命令以顶层 [README.md](README.md) 为唯一来源，改动安装方式时先改那里。
- 翻译约定见 [GLOSSARY.md](GLOSSARY.md)：保留英文的词、译法表、避免使用的词都以它为准。

## 翻译边界

只翻译散文。以下内容一律保留英文：

- YAML frontmatter 键名与 `name:` 值；`description:` 值翻译
- 代码块、行内代码、文件路径、命令、URL、模型 slug
- 逐字触发短语、示例引文、模板占位符（`{...}`、`$ARGUMENTS`）
- `tools/`、`tests/`、`plugins/pstack/pi/` 等代码目录

## 版本与发布

插件按**版本号**自动更新：内容改了而版本号没动，安装端什么都收不到。

- pre-commit 钩子（`.githooks/pre-commit`，经 `core.hooksPath` 启用）会在 `plugins/pstack/` 内容改动时自动补 patch 版本号：提升 `VERSION`、同步五个清单文件、在 `CHANGES.md` 顶部插入占位条目（pre-commit 阶段读不到提交信息，标题固定为"内容更新"，需要你改成实际说明）。
- 手动发版优先于钩子：若本次提交已包含 `VERSION` 改动，钩子不再干预。手动发版三步：改 `VERSION`、写 `CHANGES.md` 条目、跑 `node scripts/sync-plugin-version.mjs` 同步清单。
- `node scripts/sync-plugin-version.mjs --check` 校验 VERSION 与五个清单一致，不改任何文件。

## 与上游管线的分叉（已调和）

汉化以 fork 登记制接入管线：译文文件在 `tools/forks.json` 逐个声明（`kind: policy`），生成器对声明过的 fork 和已翻译的 port-only 生成物（effort agents、Codex stubs、portable 拷贝、port-only 引用与 hook）按内容跳过盖章、重写与扫描；清单等真正生成物仍归生成器管。`Generated files current` 与 `Fork registry` 两个 CI 检查有效且通过，`ci.yml` 已重新启用。

- 译文文件不要用 `bun tools/generate.mjs` 去"修复"：生成器按英文上游形态规划，fork 路径已被跳过。清单版本同步用 `node scripts/sync-plugin-version.mjs`。
- 新增或翻译新文件时，在 `tools/forks.json` 对应组件下补一条声明（`kind: policy`、`upstream: not-proposed`），否则 Fork registry 检查失败。port-only 文件不能声明（sync 会拒绝），已翻译的 port-only 生成物在 generate.mjs 的 `PORT_ONLY_TRANSLATED` / `TRANSLATED_PUT_DIRS` 清单里维护。
- 结构性契约保持英文：Per-skill notes 表头 `| Skill | On <runtime> |` 等，`loadLeadLines` 与 sync 依赖它们解析。
- 同步上游新版本：`bun tools/sync.mjs <component> <sha> --dry-run` 预演，译文文件会以三方冲突呈现，手动合并。这是本仓库的常态成本，不是故障。
- 锚点链接按 GitHub slug 书写（`#模型`、`#其他运行时` 这类 CJK slug）；markdownlint 停用了 MD051，因为它的 slug 算法剥掉 CJK 而 GitHub 保留，片段有效性由 links job 的 lychee 兜底。

## 钩子

- `.githooks/pre-commit`：先做密钥扫描（命中已知 token 特征即拒绝提交），再按上述规则自动补版本。误报可改写措辞，确认安全可用 `git commit --no-verify` 跳过。
- 本机另有 `git push` 包装（`~/.bashrc` 中的 `git()` 函数，调 `~/.config/pstack-claude/post-push.sh`）：推送后校验 GitHub 仓库可见性保持 public，并打印安装命令。该钩子属于本机配置，不在仓库内。
