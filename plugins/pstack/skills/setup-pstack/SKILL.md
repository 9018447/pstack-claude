---
name: setup-pstack
description: 配置 pstack 各角色使用哪些模型。检测可用模型并写入当前运行时的覆盖表。用于 /setup-pstack、"configure pstack models"、更改 pstack 的模型选择，或开关 SessionStart hook。
---

# pstack 安装配置

在 Codex 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/codex-tools.md)，包括其中针对各 skill 的说明。

在 GitHub Copilot 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/copilot-tools.md)，包括其中针对各 skill 的说明。

在 GitHub Copilot 上，按照 [Copilot 安装配置](copilot.md)执行，替代步骤 1、3、4 和 7，以及步骤 6 中的表头。

在其他运行时上，阅读下方[其他运行时](#other-runtimes)一节，了解表放在哪里以及如何加载；步骤是一样的。

写入当前运行时的按角色模型覆盖表，路径用[其他运行时](#other-runtimes)中所列。每个 pstack skill 都在内联处写明默认模型；覆盖表把这些默认值适配到你实际可用的模型。

Claude Code 没有像 Cursor 的 `.mdc` 那样自动应用的 "rules" 机制。Claude Code 的配置目录在设置了 `$CLAUDE_CONFIG_DIR` 时是该变量，否则是 `~/.claude`。本 skill 把它称为 `<config>`。包含是显式的：用户在 `<config>/CLAUDE.md`（或项目里的 `CLAUDE.md`）中加一行，如：

```text
@<config>/pstack-models.md
```

其中 `<config>` 写成解析后的真实路径，这样该文件就会作为上下文在每个会话加载。

Codex 的主目录在设置了 `$CODEX_HOME` 时是该变量，否则是 `~/.codex`。本 skill 把它称为 `<codex-home>`。

## 步骤

### 1. 检测可用模型

枚举本会话中 `Agent` 工具的 `model` 参数接受的模型名。那才是可靠的来源。在 Claude Code 上，它们是下方[模型](#models)中列出的系列名，每个运行该系列的当前模型，完整模型 ID 会被拒绝。默认小组名单也在那里列出。该名单是按跨系列多样性挑选的。请用户确认或粘贴他们想用的任何其他 slug。绝不写入一个你未确认可用的真实 slug。别名 `inherit-parent` 和 `auto` 始终有效，即使它们不是检测到的 slug。两者都表示该角色运行在父会话的模型上，`Agent` 调用通过省略 `model` 来表达这一点。

### 2. 读取当前状态

默认的角色到模型映射就是下方"写入覆盖表"步骤中展示的形态。如果当前运行时的表已存在，读取它并把它的值当作当前选择。否则从那些默认值开始。角色不在该形态中的行（如 `how critics`）来自已退役的角色，丢弃它。较旧的表可能写出以 `claude-` 开头的完整模型 ID，`Agent` 工具会拒绝它们。把每个替换为其系列名，即 `claude-` 后面的那个词。

### 3. 映射并确认

展示每个角色及其当前模型，把任何不在检测集合中的真实 slug 标记为需要选择。同时列出步骤 2 丢弃或改写的每一行。询问是照原样接受还是修改特定角色，选项给出检测到的模型加 `inherit-parent` 和 `auto`。优先用 `AskUserQuestion` 而不是自由文本。对于小组角色（arena runners、architect runners、interrogate reviewers），值是一个列表，每个条目跑一个 subagent，别名条目也算，因此列表长度决定数量。`arena cross-judge pool` 也是一个列表，但 Arena 会从中选择一个模型系列尽可能不同于父会话的值。`swarm workers` 是每个 worker 的默认模型，除非竞速或对比按分支指定了别的模型。

然后询问默认推理力度，即 `default effort` 行。它是 `session`（保持父会话的力度），或[模型](#models)中的某个级别。从那里列出的默认值开始。每个不带后缀的角色值都按它运行。然后询问是否有角色要用另一个级别运行。在 Claude Code 上，角色值可以在其 slug 后带一个级别，如 `<slug> @xhigh`；小组条目各自带自己的，如 `<slug> @xhigh, <slug> @max`。每个级别都通过 plugin 的该级别 effort agent 分派，因此该选择无需改变会话即可生效。默认力度则不写后缀。

### 4. 选择 session hook 是否为任务路由

在 Claude Code 和 Codex 上，plugin 的 `SessionStart` hook 会在启动、恢复、清屏和压缩时注入 poteto-mode 强制指令。Codex 会要求用户先通过 `/hooks` 信任 plugin hook，然后才运行它们。在 Pi 上，pstack 扩展会在每次 agent 启动时把同样的强制指令加入系统提示词。询问是否保留该 hook。默认开启。答案就是当前运行时表中的 `session hook` 行：`on` 或 `off`。没有表或没有该行时，hook 会注入。该行在其他运行时上不起作用。

### 5. 校验

写入的每个真实 slug 都必须在检测集合中。`inherit-parent` 和 `auto` 始终通过。校验 slug 时去掉任何 `@<level>` 后缀，级别则对照[模型](#models)中的力度级别。`default effort` 的值是那些级别之一或 `session`。在 Codex 上，级别改为你的 Codex 模型接受的 `reasoning_effort` 值。如果选定的真实 slug 或级别不可用，停下来重新询问。

### 6. 写入覆盖表

按下面的形态写入当前运行时的表。整个文件覆盖写入，保证重跑的幂等性。

```markdown
# pstack model configuration

Per-role model overrides for pstack skills. Each pstack SKILL.md names its defaults in a Models section; the values here override those defaults. Delete a line to fall back to the skill default. A value of `inherit-parent` or `auto` runs that role on the parent session's model (the `Agent` call omits `model`); an alias entry in a panel list still counts toward that panel's fan-out. A model may carry a reasoning effort, as in `opus @xhigh` (levels: low, medium, high, xhigh, max); the role then runs through the pstack effort agent of that level, each entry of a panel list on its own. `default effort` sets the level for a value without one; `session` keeps the parent session's effort. `session hook: off` stops the Claude Code or Codex SessionStart hook, or the pstack Pi extension, from injecting the poteto-mode mandate; any other value, or no line, leaves it on.

feature, refactoring: opus
bug-fix: fable
perf-issue: fable
hillclimb: fable
judgment and prose: opus
strongest judgment: fable
how explorer: opus
how explainer: opus
why investigators: opus
why synthesizer: opus
reflect tooling: opus
reflect judgment, divergent, synthesizer: opus
arena runners: opus, fable, sonnet, haiku
arena cross-judge pool: opus, fable, sonnet, haiku
swarm workers: opus
architect runners: opus, fable, sonnet, haiku
interrogate reviewers: opus, fable, sonnet, haiku

default effort: session
session hook: on
```

### 7. 接入

在 Claude Code 上，如果 `<config>/CLAUDE.md` 尚未包含 `<config>/pstack-models.md`，追加一行 `@` 写明表的解析后路径，如 `@~/.claude/pstack-models.md`，让模型行在每个会话加载。如果用户偏好项目级，就把这行 include 加到项目的 `CLAUDE.md`。

在 Codex 上，把模型行和 `default effort` 行粘贴到 `<codex-home>/AGENTS.md`；Codex 没有 `@` include。不要把 `session hook` 行粘贴到那里：plugin hook 直接从 `<codex-home>/pstack-models.md` 读取它。

### 8. 确认

告诉用户覆盖写到了哪里、模型行如何加载、plugin hook 是否开启。重跑本 skill 会更新覆盖表。

### 9. 提议创建验证 skill（可选）

检查项目是否已有驱动真实应用来取证的方式（项目的 `verify` 或 `verify-*` skill，或现成的测试框架）。如果没有，提议一次："想要一个项目级的验证 skill 吗？让 agent 能像用户一样驱动应用并证明改动有效。我可以用 /create-verification-skill 生成一个。"同意则调用 [`/create-verification-skill`](../create-verification-skill/SKILL.md)。拒绝则继续，不再推销。

## 其他运行时

角色行在所有运行时上都一样。不同的是表的路径、运行时如何加载它，以及你如何列出模型。用运行时自己的工具检测模型，绝不写入一个你没有见其列出的 slug。subagent 调用没有 model 参数的运行时也照样拿到表，作为用户选择的记录，并在它能应用的地方应用。`session hook` 行适用于 Claude Code、Codex 和 GitHub Copilot plugin，以及 pstack Pi 扩展。

| 运行时 | 表 | 加载方式 | 列出模型 | 状态 |
| --- | --- | --- | --- | --- |
| Claude Code | `<config>/pstack-models.md` | `<config>/CLAUDE.md` 中的 `@<config>/pstack-models.md` | `Agent` 工具的 model 参数 | 已实机验证 |
| Codex | `<codex-home>/pstack-models.md` | 模型行：粘贴到 `<codex-home>/AGENTS.md`；hook 设置：由 plugin 读取 | 你配置的 Codex 模型，见 [codex-tools.md](../poteto-mode/references/codex-tools.md#模型名) | hook 契约已测试；发现已验证 |
| Pi | Pi agent 目录中的 `pstack-models.md`，即 `$PI_CODING_AGENT_DIR` 或 `~/.pi/agent` | 由 pstack Pi 扩展读取，模型行和 hook 设置都读；没有 include 行 | `pi --list-models`，见 [pi-tools.md](../poteto-mode/references/pi-tools.md#模型名) 及其 `setup-pstack` 说明 | 扩展契约已离线测试；实机结果见仓库的 `docs/pi-equivalence.md` |
| GitHub Copilot（CLI 和应用） | `${COPILOT_HOME:-~/.copilot}/pstack-models.md` | plugin hook 检查它并在会话开始时注入其角色行；仅 skills 安装用 `view` 读取 | `task` 工具的 `model` 枚举，见 [copilot-tools.md](../poteto-mode/references/copilot-tools.md#模型名) | hook 契约已测试；CLI 安装已冒烟测试 |
| opencode | `~/.config/opencode/pstack-models.md` | 把该路径加入 `opencode.json` 的 `instructions` 数组 | 会话中的 `models` 斜杠命令 | 来自公开文档，无实机会话 |
| Gemini CLI | `~/.gemini/pstack-models.md` | `~/.gemini/GEMINI.md` 中的 `@~/.gemini/pstack-models.md` | 会话中的 `model` 斜杠命令 | 来自公开文档，无实机会话 |
| Prime Agent | 无文档记载的表路径；模型由 Prime 的配置选择 | | | 无实机会话 |

## 模型

由 `plugins/pstack/models.json` 生成（在该文件中修改，重跑 `tools/generate.mjs`）。

- 可用的 Claude 模型：`opus`, `fable`, `sonnet`, `haiku`
- 默认小组名单：`opus`, `fable`, `sonnet`, `haiku`
- 推理力度级别：`low`, `medium`, `high`, `xhigh`, `max`
- 默认推理力度：`session`
- 单角色默认：`opus`
