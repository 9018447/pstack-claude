# pstack（简体中文版）

本仓库由 `9018447` 维护，是 [michael-denyer/pstack-claude](https://github.com/michael-denyer/pstack-claude) 的第三方**简体中文汉化版**，非官方仓库。上游本身是 Lauren Tan 的 [pstack](https://github.com/cursor/plugins/tree/main/pstack)（一个提升 agent 工作成效的 Cursor skill 栈）面向 Claude Code、Codex、Pi、GitHub Copilot 及其他 agent harness 的移植。以下中文版安装方式均指向本仓库；英文原版见[上游仓库](https://github.com/michael-denyer/pstack-claude)。

自 **0.9.82** 起，本仓库把插件的全部内容译为简体中文：每个 skill（SKILL.md、references、playbooks）、plugin agents、effort agents、session hooks 和 Codex prompt stubs。翻译只动散文：frontmatter 键名与 `name` 值、代码块、命令、路径、URL、逐字触发短语和示例引文保留英文，因此 skill 分发、按路径加载和脚本行为与上游一致。术语定译见 [GLOSSARY.md](GLOSSARY.md)。

告诉 `poteto-mode` 你的目标，它会为任务调用正确的工作流。它让你的代码简洁、简单、经过验证。

对于并发缺陷和测试覆盖不到的不变量，另见独立的 [agent-formal-verify](https://github.com/michael-denyer/agent-formal-verify) 插件，它提供 TLA+ 模型检查和 Lean 证明。

## 安装

插件安装由各 agent 按其更新机制管理。**中文版命令均指向 `9018447/pstack-claude`**；英文上游仓库的 marketplace 命令不适用于中文版。插件自动更新按版本号安装：新内容需要版本号提升后，安装端才能获取。本仓库内容改动由 pre-commit 钩子自动补版本号（见 [CLAUDE.md](CLAUDE.md)）。

### Claude Code

在 Claude Code 中运行：

```text
/plugin marketplace add 9018447/pstack-claude
/plugin install pstack@pstack-claude
```

默认不会自动更新。安装后，在 `/plugin` → Marketplaces 中为 `pstack-claude` 一次性开启自动更新；若提示找不到插件，先运行 `/plugin marketplace update` 再重试。

### Codex

在终端运行：

```shell
codex plugin marketplace add 9018447/pstack-claude
codex plugin add pstack@pstack-claude
```

### Pi

在终端运行：

```shell
pi install git:github.com/9018447/pstack-claude
```

该包会加载 skills 和 pstack Pi 扩展：扩展补上 skills 用到的 subagent、question 和 wake-up 工具，外加 `/loop` 和路由指令。用 `/skill:<name>` 调用 skill。

### GitHub Copilot

在终端运行：

```shell
copilot plugin marketplace add 9018447/pstack-claude
copilot plugin install pstack@pstack-claude
```

这会为 Copilot CLI 和 GitHub Copilot app（共享 `~/.copilot`）安装 pstack。安装后新开会话。Copilot 不带默认 pstack 模型，第一个需要角色模型的 skill 会运行 `setup-pstack`，从你账号可用的模型中挑选，之后的会话复用该选择。

运行 `setup-pstack` 可以改模型默认值、按角色设置推理力度（例如 `arena runners: opus @xhigh, fable @max`，Claude Code 经插件的 `pstack:effort-<level>` 或 `pstack:poteto-agent-<level>` agents 分发；未指定档位的角色沿用会话力度，除非配置表的 `default effort` 行另有指定），或关闭自动路由。插件在 Claude Code、Codex 和 GitHub Copilot 上安装路由 hook；Codex 会先请你通过 `/hooks` 信任它。在 Pi 上由扩展注入同一路由指令。在 Claude Code 和 Copilot CLI 中使用 `/pstack:setup-pstack`。

Prime Agent、OpenCode、Gemini CLI 或任意 harness 的 skills-only 安装见[共享安装说明](docs/reference.md#shared-skills-installation)。

## 快速上手

```text
用 poteto-mode 修复搜索筛选器在翻页时被重置的问题。
```

对缺陷：它复现失败，用 `how` 和 `why` 调查，委托修复，然后重跑失败用例。修复跨越函数边界时，实现之前会先引入 `architect`。你拿到的是修复本身，外加失败与通过的证据。

[其他 playbook](plugins/pstack/skills/poteto-mode/SKILL.md#playbooks) 覆盖规划、功能开发、重构、性能问题、调查、原型、PR 维护、发布交付和更长周期的项目。

![poteto-mode 在 Claude Code、Codex 和 Pi 上把一个请求变成经过验证的工作。选择 playbook，用 architect、arena 或 swarm 规划与委派，再用 interrogate、测试和测量做审查与验证。项目 playbook 定制工作流，setup-pstack 按角色配置模型与推理力度。辅助 skill 包括 how、why 和 unslop。](assets/pstack-overview.png)

## 详细文档

- [Skills 与斜杠命令](docs/reference.md#slash-commands)
- [各运行时配置](docs/reference.md#runtime-support)
- [模型与依赖](docs/reference.md#configuration-and-dependencies)
- [维护与移植范围](docs/reference.md#maintenance)

以上链接指向上游英文参考文档；`docs/` 目录暂未翻译。

## 数据处理

pstack 没有服务器，也没有遥测。skills 让 agent 读取的一切内容（包括会话 transcript）都只发往你的模型提供商。脚本在本地运行，PR 工具使用你的 GitHub CLI 登录。

## 贡献

翻译问题（误译、术语不一致）直接开 issue 或 PR。上游功能缺陷请先在上游仓库确认，再决定是随上游修复同步过来，还是在本仓库先行处理。漏洞按 [SECURITY.md](SECURITY.md) 私下报告。

汉化工作与上游维护均欢迎支持：[给上游移植维护者买杯咖啡](https://buymeacoffee.com/codenyer)。

## 许可证

本汉化版遵循上游许可：移植版及其修改与新增内容以 [MIT](LICENSE) 授权，© 2026 Michael Denyer；原版 pstack © 2026 Lauren Tan；导入的 cursor-team-kit skills © 2026 Cursor。见 [LICENSE-cursor-team-kit](LICENSE-cursor-team-kit) 与 [NOTICE.md](NOTICE.md)。中文翻译部分同样以 MIT 授权。
