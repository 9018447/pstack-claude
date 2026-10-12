---
name: reflect
description: 在当前会话 transcript 上启动三个并行的审查 subagent，提炼可持久沉淀的经验，并把每条经验路由为对某个现有 skill 的具体修改。当用户说 reflect 时使用。
---

# Reflect

在 Codex 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/codex-tools.md)，包括其中针对各 skill 的说明。

在 GitHub Copilot 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/copilot-tools.md)，包括其中针对各 skill 的说明。

从当前对话中挖掘可持久沉淀的经验，然后将其路由为对 skill 的修改。

## 何时调用

当用户说 "reflect" 或 "/reflect" 时调用。如果对话琐碎、跑题，或已被父 agent 正确遵循的某个现有 skill 覆盖，则跳过。一次性事件不算经验。

## 流程

### 1. 定位当前会话 transcript

父 agent 在分派之前先找到自己的 transcript 文件。系统提示词指明了 Claude Code 的按项目 transcript 目录 `~/.claude/projects/<encoded-cwd>/`。使用该路径。不要跨 `~/.claude/projects/` 全局搜索。那会跨越工作区边界，读取无关项目的私人对话。

运行已安装 plugin 下的查找脚本 `skills/reflect/scripts/find-transcript.mjs`，传入 projects 目录和对话开头用户 prompt 的一个片段：

```bash
node <plugin>/skills/reflect/scripts/find-transcript.mjs ~/.claude/projects/<encoded-cwd> "<opening prompt fragment>"
```

它覆盖三种布局（扁平 `<id>.jsonl`、嵌套 `<id>/<id>.jsonl`、subagent `<parent>/subagents/<child>.jsonl`），按最新优先排序，并打印第一条开头用户键入的 prompt 含有该片段的路径。不要手工重新实现扫描：transcript 的第一行是会话元数据而非消息；以 `/clear` 或 `!` shell 命令开头的会话会在 prompt 之前把该命令的包装器和输出记录为 `user` 记录；文件可能长达数兆字节，因此查找器会流式读取每个候选文件，并在第一条用户键入的 `user` 记录处停止。如果它以退出码 1 结束，就为该会话写一份紧凑的摘要，改为传入摘要。摘要按对话顺序逐行列出：用户的 prompt 与纠正、工具调用及其结果、涉及过的文件。它不下任何诊断、结论或归因。评判会话的是审查者，不是你对会话下的结论。

### 2. 并行启动三个审查者

一条消息、三次 `Agent` 调用，`subagent_type: "general-purpose"`，`model` 按下文设置。审查者需要 MCP 访问权限来查询上下文（transcript 中引用的工单、聊天线程、可观测性 trace）。选择能保留 MCP 访问权限的 subagent_type。prompt 中禁止写文件。修改由父 agent 应用。

每个审查者和综合者都对应 `pstack-models.md` 中的一个角色行，以及[模型](#models)一节中的一个默认值。将 `model` 设为该行的值；如果表或行缺失，则用默认值。当值为 `auto` 或 `inherit-parent` 时，不设置 `model`。如果 `Agent` 工具拒绝某个 slug，就改用默认值并说明。如果它拒绝默认值，就从其错误信息中选用同系列最接近的有效 slug。

| 视角 | 角色行 | Prompt 模板 |
|---|---|---|
| 判断 | `reflect judgment, divergent, synthesizer` | `references/judgment-reviewer.md` |
| 工具 | `reflect tooling` | `references/tooling-reviewer.md` |
| 发散 | `reflect judgment, divergent, synthesizer` | `references/divergent-reviewer.md` |

原样传入每个模板，在标记处替换为 transcript 路径或摘要。除 transcript 路径外不要附加任何内容，哪怕是针对长 transcript 的重点提示也不行。审查者在 `Agent` 响应体中返回发现。

### 3. 综合

一次 `Agent` 调用，`subagent_type: "general-purpose"`，`model` 取自 `reflect judgment, divergent, synthesizer` 行（默认值见[模型](#models)）。选择能保留 MCP 访问权限的 subagent_type。综合者的质量检查包括抽查核实引用，这可能需要 MCP 访问权限。原样使用 `references/synthesizer.md`，并在标记处内联每个审查者的完整输出。综合者返回结构化的 Accepted / Rejected / Backlog 列表。

### 4. 结构化强制检查

对综合者的 Accepted 列表做合理性检查。凡是改用 lint 规则、脚本、元数据标记或运行时检查能更可靠地强制执行的项目，都从 Accepted 移到 Backlog。参见 **encode-lessons-in-structure** 原则 skill。

### 5. 应用

在应用任何 Accepted 修改之前，先把综合者完整的 Accepted/Rejected/Backlog 输出呈现给用户，并等待明确批准。用户选择应用哪个子集，也可以改写路由。对 skill 的修改会影响组织中的每一个未来 agent。不要自动应用。

Backlog 条目自动归档到你们团队使用的任何 devex / backlog 跟踪器。只有 Accepted 列表需要等待批准。

对每条已批准的 Accepted 条目，严格按路由字段执行：

- 琐碎的现有 skill 修改（一行要点、一句措辞收紧、更正一条过时事实）：父 agent 直接完成。
- 实质性的现有 skill 修改（新增一节、新增一个模式表、超过约 10 行）：交给 **plugin-dev:skill-development** skill，运行其草稿 / 测试 / 迭代循环。
- `tune description: <skill path>`（skill 存在但在该触发时没有触发）：交给 `plugin-dev:skill-development`，运行其描述优化循环。
- `new skill via plugin-dev:skill-development: <kebab-name>`：创建工作交给 `plugin-dev:skill-development`。不要临时发明形式。

如果你的环境自带 SKILL.md 校验器，在宣布完成前对每个改动过的 skill 运行它。没有就跳过这一步。

### 6. 向用户汇报

简短列表，不要开场白：

- 已应用的修改：`<skill path>`。改了什么，每条一行。
- 新建的 skill：`<skill path>`。每条一行（少见）。
- 已归档到 devex 跟踪器的 Backlog：`<issue title>`（`<tags>`）。每条一行。
- 已丢弃：每条被拒绝的发现一行 + 综合者给出的理由。

## 模型

角色默认值，由 `plugins/pstack/models.json` 生成（在该文件中修改，然后重新运行 `tools/generate.mjs`）。`pstack-models.md` 覆盖表中匹配的角色行会在运行时覆盖各项；`/setup-pstack` 负责写入它，并按运行时列出其路径。

- reflect tooling: `opus`
- reflect judgment, divergent, synthesizer: `opus`

## 推理力度

覆盖表中的角色值可以在模型名后附加推理力度，如 `opus @xhigh`。Claude Code 上的级别：`low`、`medium`、`high`、`xhigh`、`max`。哪些级别可用取决于模型。不带 `@` 的值采用表中的 `default effort` 行——一个级别或 `session`；表没有该行时用 `session`。`session` 不设置力度，因此按常规方式分派。读取模型前先去掉后缀：`inherit-parent` 或 `auto` 在任何级别下都仍省略 `model`，模型名则照常作为 `model` 传入。在 Claude Code 上，一个级别会从你本要使用的 `subagent_type` 中选出一个 effort agent。`pstack:poteto-agent` 变为 `subagent_type: "pstack:poteto-agent-<level>"`。`general-purpose` 或未指定 `subagent_type` 时，变为 `subagent_type: "pstack:effort-<level>"`。effort agent 只设置 `effort`，因此你传入的模型仍决定实际模型。在 Codex 上，把级别作为 `spawn_agent` 的 `reasoning_effort` 传入，并保留常规指令。
