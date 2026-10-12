# pstack 的 Codex 工具映射

pstack skill 用 Claude Code 工具语言编写（`Skill` 工具、`Agent` 工具、`AskUserQuestion`、Claude 模型名）。在 Codex 上是同一批文件，只是工具名解析不同。当 pstack skill 提到某个 Claude 工具、driver 或内置 skill、或某个 Claude 模型时，阅读本文。本文仅针对 Codex。Gemini CLI、opencode、Prime Agent 及其他运行时必须使用各自具体的工具、模型名和配置路径。

## 工具操作

| pstack / Claude 操作 | Codex 等价物 |
|----------------------|--------------|
| 读取文件 | `shell`（`cat`、`head`、`tail`） |
| 创建/编辑/删除文件 | `apply_patch` |
| 运行 shell 命令 | `shell` |
| 搜索文件内容/查找文件 | `shell`（`rg`、`grep`、`find`、`ls`） |
| 抓取 URL | `shell` 加 `curl` / `wget` |
| 搜索网页 | `web_search` |
| 调用 skill（`Skill` 工具、`/command`） | skill 原生加载。按呈现的指令执行。 |
| 派发 subagent（`Agent`/`Task` 工具） | `spawn_agent` |
| 一回合内并行派发 N 个 subagent | 一次回复里发出 N 个 `spawn_agent` 调用 |
| 等待 subagent 结果 | `wait_agent` |
| 释放已完成 subagent 的槽位 | `close_agent`，前提是会话暴露了它。有些 Codex 宿主没有。 |
| 跟踪任务（todolist；`TaskCreate` / `TaskUpdate`，Claude Code 上是 `TodoWrite`） | `update_plan` |
| 向人类提出固定选项的问题（`AskUserQuestion`） | 用纯文本提问，让用户回答。Codex 没有结构化选项工具。 |

派发 subagent 需要启用 `multi_agent`。在 `~/.codex/config.toml` 中添加：

```toml
[features]
multi_agent = true
```

没有它，`spawn_agent` 不可用，扇出类 skill（`interrogate`、`why`、`how`、`arena`、`reflect`）退化为单次顺序执行。要求的独立审查不退化，保持阻塞，如 poteto-mode 的 [Subagents](../SKILL.md#subagents) 一节所述。

启用 `multi_agent` 不会解除宿主的线程上限。`spawn_agent` 报线程上限错误属于容量错误，不是模型 slug 被拒，所以 skill 里换一个模型重试的兜底不适用。第一次容量被拒后就停止生成。先用 `close_agent` 关掉已完成的 agent 再重试；会话没有 `close_agent` 时，不要假设已完成 agent 的槽位已释放。

## Subagent 策略

poteto-mode 的 Subagents 一节设定了 Claude 特有的默认值（`subagent_type: "pstack:poteto-agent"`、`run_in_background: true`）。在 Codex 上：

- 没有 `poteto-agent` 这个 subagent 类型。要让临时 subagent 走 poteto-mode 的风格，就派发一个 `spawn_agent`，其指令要求它先完整阅读 `poteto-mode` skill。
- `spawn_agent` 调用本就与你的回合并发执行，所以 `run_in_background: true` 没有对应的独立旗标。发出派发后继续即可。
- 不存在 `pstack:effort-<level>` 或 `pstack:poteto-agent-<level>` 类型。角色值带 `@<level>`、或 `default effort` 行指名了级别时，把该级别作为 `spawn_agent` 的 `reasoning_effort` 传入，派发的其余部分保持不变。`session` 不传 `reasoning_effort`。
- 也没有 `comment-sicko` 这个 subagent 类型。**no-comments** skill 在 Claude Code 上会生成它；在 Codex 上派发一个 `spawn_agent`，其指令要求它先完整阅读 `poteto-mode/references/agents/comment-sicko.md`。
- Claude Code 上每个 subagent 都跑在本机，所以 **swarm** skill 的 worker 和扇出类 playbook（`orchestrate`、`autopilot-full`、`autopilot-stack`）用工作树隔离写入者。Codex 上同样如此。
- 其余政策不变。传文件指针而非内联上下文，写入型 worker 各给一个工作树或分支，每个 subagent 的 diff 都由你亲自审查。

## 模型名

skill 里写的是 Claude 默认值（code/prose/judgment 的单角色默认模型，外加供多模型面板使用的多模型面板；每个消费模型的 skill 在自己的 Models 一节列出）。这些 slug 在 Codex 上解析不了。替换成你配置的 Codex 模型：

- 单模型角色：你的主力 Codex 模型（例如 `gpt-6-sol`）。
- 默认用最强 Claude 模型的角色（`bug-fix`、`perf-issue`、`hillclimb`、`strongest judgment`）：你最强的 Codex 模型（例如 `gpt-6-astra`）。
- 多模型面板（`arena`、`architect`、`interrogate`、`how` 批评者、`reflect`）：对抗信号来自模型多样性，所以使用你能用的彼此不同的 Codex 模型。ChatGPT 上不错的默认面板是 `gpt-6-astra`、`gpt-6-sol`、`gpt-6-luna`。如果只能接触到一个模型家族，就改变推理强度，并在结论中注明多样性有所降低。

`/setup-pstack` 写出配置好的模型列表。在 Codex 上，把它设为你的 Codex 模型 slug。

## 会话路由 hook

原生 pstack 插件与 Claude Code 插件捆绑相同的 `SessionStart` 路由指令，macOS 与 Linux 上是 `session-start.sh`，Windows 上是 `session-start.ps1`。用户通过 `/hooks` 信任该 hook 后，Codex 会在启动、resume、clear 和 compact 时运行它。hook 从 Codex 表读取 `session hook`，路径见 [setup-pstack 的 runtime 表](../../setup-pstack/SKILL.md#其他运行时)；`session hook: off` 会停用注入。

只装 skill 的安装不含插件 hook。这种情况下请显式请求 `poteto-mode`，或在 `AGENTS.md` 中加一条常设指令。

## pstack 引用的 driver 与内置 skill

[驱动器政策](../SKILL.md#non-negotiables)决定选用哪个 app 驱动器。这些工作流点名的 skill 与驱动器，在 Codex 上用这些等价物：

| pstack 点名的 skill 或驱动器 | 在 Codex 上 |
|------------------------------|-------------|
| `run`（驱动 CLI/TUI 确认改动生效） | 通过 `shell` 亲自运行 app 并观察真实输出。 |
| 项目 UI 驱动器 | 用手头任何自动化驱动 UI，或给用户一个具体的手动检查。未亲眼确认产物之前不要宣称完成。 |
| `plugin-dev:skill-development`（Claude 的 SKILL.md 编写指南） | 遵循你所在平台的 skill 编写指南，有 `writing-skills` skill 就用它。保留 `name` + `description` frontmatter 和渐进式披露。 |
| `loop`（周期性/自定节奏的再次调用，`babysit` 会用到） | Codex 没有 `loop` skill。自己按节奏重跑该步骤，有 Codex 定时任务就用定时任务。 |

## 各 skill 的注意事项

受影响的 skill 入口和可选的 Codex slash 存根都指向这里。多数 skill 只需上面的表。下面这些还需要一条映射：

| Skill | On Codex |
|-------|-------------|
| `interrogate` | `subagent_type`/`model`/`readonly` 派发字段映射到 `spawn_agent`；替换为你配置的 Codex 模型，并保持评审面板的模型多样性。 |
| `setup-pstack` | 该 skill 的 Other runtimes 表写明 Codex 表的路径和加载方式；slug 就是你的 Codex 模型（见上面的模型名）。角色行完全相同。 |
| `no-comments` | 没有 `comment-sicko` 这个 subagent 类型；见上面的 Subagent 策略。 |
| `teach` | 并行运行 `how` 与 `why` 映射为 `spawn_agent` 扇出；图像生成用配置好的 Codex 等价物。 |
| `create-verification-skill` | 生成的 skill 在 Claude Code 上落在 `.claude/skills/verify/`；改写到 Codex 的项目 skill 位置。驱动 app 的测试装置与平台无关。 |
| `maintain-verification-skill` | 并行的逐特性源码阅读器映射为 `spawn_agent` 扇出；项目级 skill 位于 Codex 的 skill 位置，不在 `.claude/skills/`。 |
| `babysit` | `loop` 与 `AskUserQuestion` 按上面的表解析。 |
| `automate-me` | `plugin-dev:skill-development` 按上面的 skill 表解析。 |
| `architect` | runner 面板经由 **arena** skill，其 `spawn_agent` 扇出与模型替换同样适用。 |
| `arena` | 并行候选与交叉评审映射到 `spawn_agent`；runner 和交叉评审池都替换为你配置的 Codex 模型（见上面的模型名）。 |
| `how` | 并行探索者与讲解者映射为 `spawn_agent` 扇出；替换为你配置的 Codex 模型。 |
| `reflect` | 三位审查者与综合者映射到 `spawn_agent`；替换为你配置的 Codex 模型。转录查找器读的是 `~/.claude/projects/` 下的 Claude Code 布局，所以改传 step 1 允许的会话摘要。 |
| `swarm` | 每个 worker 都是对你配置的 Codex 模型的一次 `spawn_agent` 调用，这些调用本就并发执行；给每个写入型 worker 自己的工作树或输出目录（见上面的 Subagent 策略）。 |
| `why` | 并行调查者与综合者映射到 `spawn_agent`；替换为你配置的 Codex 模型。从 Codex 暴露给会话的工具中列出 MCP server，不要从 `.mcp.json` 或 `claude mcp list` 取。 |

## 随附脚本

`skills/poteto-mode/scripts/` 附带 `watch-pr` PR 监视器、`orch` 存储 CLI 和 `worktree-audit.mjs`。`watch-pr/ship-pr` 命令负责待合并状态的检查与取消；`resume.mjs` 负责 [恢复存储](resume-storage.md) 所述的共享检查点定位器。这些脚本用 bun 和 Node.js，在 Codex 上行为一致；通过 `shell` 调用。它们需要 `bun`、`gh`，栈操作还需要 `gt`。`worktree-audit.mjs` 按 shebang 用 `node` 运行。审计用 `stat` 跟踪工作树各祖先目录里的每个链接，并按链接最终落到的目录来匹配，bun 与 node 下都一样。bun 无法解析自身路径的工作树会丢失其最近聊天并落入 `review`。悬空或成环的链接会被忽略。其他任何 `stat` 无法跟随的链接，会把该链接目录下的所有工作树归入 `review`，并给出点名该链接的警告。`worktree-audit.mjs` 扫描 `$CODEX_HOME/sessions` 与 `$CODEX_HOME/archived_sessions`（默认 `~/.codex`）下的 Codex 会话，以及任何存在的 Claude Code 或 Pi 转录目录。它从 `skills/reflect/scripts/find-transcript.mjs` 导入转录遍历器，所以要把 `reflect` skill 与 `poteto-mode` 装在一起。

## 指令文件

pstack skill 说“你的指令文件”时，在 Codex 上指 `AGENTS.md`（项目根目录，另有全局的 `~/.codex/AGENTS.md`）。在 Claude Code 上是 `CLAUDE.md`。
