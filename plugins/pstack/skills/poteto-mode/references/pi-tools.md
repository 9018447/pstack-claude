# pstack 的 Pi 工具映射

pstack skill 用 Claude Code 工具语言编写（`Skill` 工具、`Agent` 工具、`AskUserQuestion`、Claude 模型名）。在 Pi 上是同一批文件，从 pstack 包加载，且该包的 Pi 扩展注册了与 Claude 同名的工具，所以大多数名称一一对应。当 pstack skill 提到某个 Claude 工具、driver 或内置 skill、或某个 Claude 模型时，阅读本文。本文仅针对 Pi。

## 工具操作

| pstack / Claude 操作 | Pi 等价物 |
|----------------------|-----------|
| 读取文件 | `read` |
| 创建文件 | `write` |
| 编辑文件 | `edit`（精确文本替换） |
| 删除文件 | `bash`（`rm`） |
| 运行 shell 命令 | `bash` |
| 搜索文件内容/查找文件 | 启用时用 `grep`、`find` 和 `ls`，否则用 `bash`（`rg`、`grep`、`find`、`ls`）。Pi 默认只启用 `read`、`bash`、`edit` 和 `write`。 |
| 抓取 URL | `bash` 加 `curl` / `wget` |
| 搜索网页 | Pi 没有网页搜索工具。用提供该能力的 MCP server。 |
| 调用 skill（`Skill` 工具、`/command`） | skill 原生加载。描述匹配时模型会读入某个 skill；`/skill:<name>` 可强制加载。 |
| 派发 subagent（`Agent`/`Task` 工具） | `agent` |
| 一回合内并行派发 N 个 subagent | 一次回复里发出 N 个带 `run_in_background: true` 的 `agent` 调用 |
| 等待 subagent 结果 | 前台 `agent` 调用直接返回最终文本。后台 agent 的完成以一条消息到达，指明其 id、状态和最终文本，时机在你当前工具调用之后、或你空闲时作为新回合，所以不要轮询。 |
| 继续或操控 subagent（`SendMessage`） | `send_message`，按 agent id 或描述寻址 |
| 列出 subagent | `list_agents` |
| 停止 subagent | `stop_agent` |
| 跟踪任务（todolist；`TaskCreate` / `TaskUpdate`，Claude Code 上是 `TodoWrite`） | Pi 没有任务跟踪工具。按 poteto-mode 为该情形描述的那样维护 `todo.md` 清单。 |
| 向人类提出固定选项的问题（`AskUserQuestion`） | `ask_user_question`，形状相同。没有交互 UI（print 或 JSON 模式）时、以及在子 agent 中，它会返回错误，所以改用纯文本提问。 |
| 自定节奏的再次调用（`ScheduleWakeup`） | `schedule_wakeup`，形状相同。到期的 wakeup 保持 pending，直到会话空闲为止，手动 compaction 期间也不例外。`noop: true` 只是给 wakeup 打个标记，它仍会被调度；`stop: true` 取消待触发的 wakeup，无需其他字段。在 print 与 JSON 模式下、以及在子 agent 中，调度会返回错误，因为 Pi 在 run 结束时就会退出，wakeup 永远无法触发。`/loop` 命令结束、或在一次 run 进行中替换了循环之后，该 run 在收尾前会被拒绝一切 wakeup，无论 prompt 写什么，且 Pi 会告知用户。其他 wakeup 一律不拒绝。 |
| 读取本工作区的会话转录（Claude Code 的 `~/.claude/projects/<encoded-cwd>/`） | Pi 的会话存放在 `~/.pi/agent/sessions/--<cwd>--/`（设置了 `$PI_CODING_AGENT_DIR` 时在其下），其中 `<cwd>` 是去掉开头 `/`、每个 `/` 换成 `-` 的工作目录。扩展启动的 subagent 会话存放在 `<agent dir>/pstack/<parent session id>/agents/`。每个文件以一行 `session` 头开始；其后的每一行都是一条带 `id` 和 `parentId` 的条目，消息条目是 `type: "message"`，`message.role` 为 `user`、`assistant` 或 `toolResult`。会话把被放弃的分支也保存在同一文件里，所以要从最后一条条目沿 `parentId` 往回跟，还原真实发生过的对话。同样的隐私规则适用：只读本工作区的目录，绝不要对 `sessions/` 做 glob。 |

`agent`、`send_message`、`list_agents`、`stop_agent`、`ask_user_question` 和 `schedule_wakeup` 来自 pstack Pi 扩展，用 `pi install` 安装 pstack 包即可加载。只装 skill 的环境里这些都没有，扇出类 skill（`interrogate`、`why`、`how`、`arena`、`reflect`）退化为单次顺序执行。要求的独立审查不退化，保持阻塞，如 poteto-mode 的 [Subagents](../SKILL.md#subagents) 一节所述。

## Subagent 策略

poteto-mode 的 Subagents 一节在 Pi 上通过 `agent` 工具生效：

- `subagent_type` 取相同的值。`pstack:poteto-agent`、`pstack:comment-sicko`、`pstack:poteto-agent-<level>` 和 `pstack:effort-<level>` 解析到插件的 agent 文件。`general-purpose` 或不填 `subagent_type` 则运行一个没有 agent 文件的子进程。Claude Code 的内置类型如 `Explore`、`Plan` 在 Pi 上不存在，改用 `general-purpose` 并把约束写进 prompt。未知类型会报错并列出有效值。
- `readonly: true`（`how` 与 `interrogate` 面板会设置它）让子进程不带 `edit` 和 `write` 工具运行。它保留 `bash`，所以审查者仍能运行 `git diff`；在 prompt 里说明它不得修改文件。
- 每个子进程都是你工作目录下独立的 `pi --mode rpc` 进程，扩展通过 stdin 把 prompt 发给它。它加载保存在磁盘上的包和设置，所以只要 pstack 是用 `pi install` 装的，它就能看到 pstack skill。它不继承父进程的命令行旗标，比如 `-e`、`--api-key` 或一次性的 `-a` 项目信任，所以只通过 `-e` 加载的 pstack 不会给子进程带来扩展。
- 子进程可以再启动自己的 agent，最深到主会话之下第三层，与 Claude Code 相同。第三层的子进程运行时没有 `agent` 工具。
- `isolation: "worktree"` 让子进程在 `.claude/worktrees/` 下自己的 git 工作树中运行。agent 结束时，工作树里什么都没留下的会被删除；只要有一个改动、一个它写入的 gitignore 文件，或其分支上、或其 HEAD 曾指向的任何提交上有提交，就会保留。
- `run_in_background: true` 立即返回 agent id。完成通知在你当前工具调用结束后加入对话（与 Claude Code 相同），或在你空闲时开启一个新回合。在 print 与 JSON 模式（`pi -p`）下，Pi 本会在 run 收尾后退出，但扩展会在后台 agent 运行期间扣住收尾，所以每个完成通知仍会作为一个回合到达，进程在最后一个之后结束。子 agent 在自己的后台 agent 运行时同样扣住收尾，因为其父进程在它收尾后就会关闭它的 stdin，而父进程发来一条消息会解除这个扣留。交互式与 RPC 主会话照常收尾，完成通知到了就接下。
- 后台 agent 运行期间，只要 `bash` 命令行中任何位置出现 `sleep` 后跟两个字面秒数及以上的时长（轮询循环也算），扩展就会拦截该命令行：`sleep 30`、`npm test; sleep 30`、`until gh pr checks 1; do sleep 30; done`、`sleep infinity`。更短的 sleep、以 `sleep 30 &` 形式放入后台的 sleep、以及引号字符串、注释或 heredoc 中的 `sleep` 都能正常运行。这条规则宁可误拦，所以 `timeout 5 sleep 30` 和后台组里的 sleep 也会被拦截。完成通知会自行到达，继续做别的事或结束你的回合即可。
- agent 的状态跟随其进程。`completed` 表示子进程已退出，`stop_agent` 也只在子进程退出后才报告 `stopped`，所以 Claude Code 那条关于 `completed` 但仍在运行的 agent 的告诫不适用于 agent 本身。停止一个 agent，与会话关闭时停掉所有 agent 一样，会终结子 pi 进程及其仍在运行的 `bash` 命令，因为 Pi 在 SIGTERM 时会杀掉该命令的进程树。已结束的 `bash` 命令留在后台的进程（`cmd &`、`nohup cmd`）运行在自己的进程组里，会比 agent 活得久；要由你自己去停。被停 agent 的通知加入对话但不开启新回合，因为 `stop_agent` 已经返回。
- agent 属于启动它的会话。退出、重载、启动、恢复或 fork 会话都会停掉所有运行中的 agent，父进程退出时也会通知其 agent 停止。恢复时，仍在启动它的 Pi 进程下运行的 agent 不被打扰。进程身份与保存记录匹配的孤儿会被通知停止，并在其进程退出之前对 `send_message` 和 `stop_agent` 不可用。若身份信息不足以安全地发信号，其进程保持原样，在确认退出之前拒绝继续。只有到那时，恢复的 agent 才被标记为 `stopped` 并允许恢复。
- 向运行中的 agent 发 `send_message` 等于在子进程 stdin 上做一次 RPC `steer`。agent 会在当前工具调用之后读到它（与 Claude Code 相同），在同一 run 中继续，并发出一条完成通知。被子进程拒绝的消息返回错误，agent 继续运行。发给已结束 agent 的消息会在后台恢复其会话，并带着它此前各次运行的上下文。在 agent 已收尾但进程尚未退出时到达的消息，会在进程退出后恢复该 agent。
- 角色值的 `@<level>` 会挑选与 Claude Code 上相同的 effort agent，扩展把该级别以 `--thinking` 传给子进程。`session` 或未设 effort 的 agent，则以父进程当前的 thinking 级别运行子进程。
- 其余政策不变。传文件指针而非内联上下文，写入型 worker 各给一个工作树，每个 subagent 的 diff 都由你亲自审查。

## 模型名

skill 在各自 Models 一节用 Claude 别名指名模型。在 Pi 上，把别名作为 `agent` 工具的 `model` 传入。pstack 扩展会按会话当前模型所属 provider 的列解析它，其他 provider 则按 `anthropic` 列解析：

| Alias | `anthropic` | `openai` | `openai-codex` |
| --- | --- | --- | --- |
| `opus` | `anthropic/claude-opus-5-5` | `openai/gpt-6.1-sol` | `openai-codex/gpt-6.1-sol` |
| `fable` | `anthropic/claude-fable-5-1` | `openai/gpt-6-astra` | `openai-codex/gpt-6-astra` |
| `sonnet` | `anthropic/claude-sonnet-5-5` | `openai/gpt-6-sol` | `openai-codex/gpt-6-sol` |
| `haiku` | `anthropic/claude-haiku-4-5` | `openai/gpt-6-luna` | `openai-codex/gpt-6-luna` |

Pi 会警告：即使在 Claude 订阅下，通过 Pi 使用 Claude 也按 token 计费，算作额外用量。该警告只在交互模式显示，`agent` 工具运行的 `pi --mode rpc` 子进程永远不会看到。

Pi 覆盖表中的一行 `pi models: opus=<provider/id>, sonnet=<provider/id>` 会把它点名的每个别名指向另一个 Pi 模型，无论会话的 provider 是谁。当会话的 provider 在上表没有对应列、且 Pi 没有 `anthropic` 凭据时，就加一行，因为此时每个别名都会解析成 `anthropic/*` ID，`agent` 调用会报 `No API key found for anthropic`。`agent` 工具也接受完整的 `provider/id`，原样透传；`inherit-parent`、`auto` 或不填 `model` 则让子进程用父进程当前模型。多模型面板（`arena`、`architect`、`interrogate`、`how` 批评者、`reflect`）只有在各别名解析到不同模型时才保持多样性。如果只能接触到一个模型家族，就改变推理强度，并在结论中注明多样性有所降低。

`/setup-pstack` 写出配置好的模型列表。在 Pi 上，保留这些别名，用 `pi models:` 重新映射。

## 会话路由

pstack Pi 扩展会在每次 agent 启动时把 poteto-mode 的路由指令（即 Claude Code 与 Codex 的 `SessionStart` hook 注入的那段文本）加入系统 prompt，所以该指令能挺过 compaction。它还会加入 Pi 覆盖表，因为 Pi 没有上下文文件的 include 语法。该表是 Pi agent 目录下的 `pstack-models.md`，设置了 `$PI_CODING_AGENT_DIR` 时在该目录，否则在 `~/.pi/agent`。表里的 `session hook: off` 会停用该指令。`agent` 工具启动的子 agent 拿到表但拿不到指令，正如 Claude Code 的 subagent 能看到 CLAUDE.md 却不运行 `SessionStart` hook。每个会话（包括子 agent 和关闭 hook 的会话）还会拿到指向本文件的指针，以及 Claude Code 关于在同一条回复里发起独立工具调用的那句话。

没有扩展就什么都不注入。用 `/skill:poteto-mode` 显式请求 `poteto-mode`，或在 `AGENTS.md` 里加一条常设指令。

## pstack 引用的 driver 与内置 skill

[驱动器政策](../SKILL.md#non-negotiables)决定选用哪个 app 驱动器。这些工作流点名的 skill 与驱动器，在 Pi 上用这些等价物：

| pstack 点名的 skill 或驱动器 | 在 Pi 上 |
|------------------------------|----------|
| `run`（驱动 CLI/TUI 确认改动生效） | Pi 没有 `run` skill。通过 `bash` 亲自运行 app 并观察真实输出。 |
| `verify`（项目的 `.claude/skills/verify/`，或 Claude Code 捆绑的 `/verify`） | Pi 不会发现 `.claude/skills/`。按路径直接读项目 skill 的 SKILL.md，或在 `.pi/settings.json` 的 `skills` 列表里加上 `../.claude/skills`。没有项目 skill 时，像 `run` 那样亲自驱动 app。 |
| 项目 UI 驱动器 | 用手头任何自动化驱动 UI，或给用户一个具体的手动检查。未亲眼确认产物之前不要宣称完成。 |
| `plugin-dev:skill-development`（Claude 的 SKILL.md 编写指南） | 遵循 Pi 的 skills 文档与 Agent Skills 规范。保留 `name` + `description` frontmatter，目录以 skill 命名，并使用渐进式披露。 |
| `loop`（周期性/自定节奏的再次调用，`babysit` 会用到） | 扩展的 `/loop [interval] <prompt>` 命令。带 interval 时按该节奏反复触发；不带时 prompt 立即运行，模型用 `schedule_wakeup` 自定节奏。`/loop stop` 取消，迭代进行中也可以：该 run 之后调度的任何东西都不会被布置。在一次 run 期间发出的 `/loop` 会在该 run 结束后开始。 |

## 各 skill 的注意事项

没有任何 skill 文件带有 Pi 相关行。poteto-mode 的平台适配一节会指向这里一次，扩展的系统 prompt 在每个会话都指向这里，所以在照某个 skill 行事之前，先读它在表中的那一行。多数 skill 只需上面的表。下面这些还需要一条映射：

| Skill | 在 Pi 上 |
|-------|----------|
| `poteto-mode` | todolist 退化为 `todo.md`，Subagents 默认值按上面的 Subagent 策略映射。Eval 和 Session pickup playbook 从 Pi sessions 目录读转录（见工具操作）。 |
| `interrogate` | 审查者通过 `agent` 派发，`subagent_type`、`model` 和 `readonly` 照旧（见 Subagent 策略）。保持面板用彼此不同的模型（见模型名）。 |
| `recall` | 在 Pi sessions 目录中搜索本工作区（见工具操作）。不要列出或读取 `~/.claude/projects/`：那里是 Claude Code 的转录，不是本会话的历史。按 `type: "message"` 条目及其 `message.role` 匹配。 |
| `show-me-your-work` | 对照本次运行的 Pi 会话文件（见工具操作）核对日志，而不是 Claude Code 转录。 |
| `setup-pstack` | Pi 的表是 Pi agent 目录下的 `pstack-models.md`（见会话路由），扩展会加载它，所以不需要 include 行。用 `pi --list-models` 列出模型。某个家族的模型不在列表中时，提供一条 `pi models:` 行（见模型名）。角色行和五个 effort 级别完全相同。`session hook` 行在 Pi 上同样生效，`off` 会阻止扩展加入路由指令。当会话跑在 `anthropic` 上时，告诉用户 Pi 把通过它使用的 Claude 按 token 计为额外用量，而每个多模型面板都会成倍放大这笔开销。 |
| `no-comments` | `pstack:comment-sicko` 按原文通过 `agent` 解析。给它的是作用域，而不是去运行 `/no-comments` 的请求，并且不要带 `isolation: "worktree"` 运行，因为工作树从 `HEAD` 开始，缺少作用域内未提交的改动。 |
| `teach` | 并行运行 `how` 与 `why` 映射为两个后台 `agent` 调用。Pi 没有图像生成工具，所以用 Mermaid 或纯文本画图。 |
| `create-verification-skill` | 生成的 skill 在 Claude Code 上落在 `.claude/skills/verify/`。改写到 Pi 能发现项目 skill 的位置，即 `.pi/skills/verify/` 或 `.agents/skills/verify/`。驱动 app 的测试装置与平台无关。 |
| `maintain-verification-skill` | 并行的逐特性源码阅读器映射为后台 `agent` 调用。项目级 skill 位于 `.pi/skills/` 或 `.agents/skills/`，不在 `.claude/skills/`。 |
| `babysit` | `loop` 与 `AskUserQuestion` 按上面的表解析。 |
| `automate-me` | `plugin-dev:skill-development` 按上面的 skill 表解析。工作区的转录就是它的 Pi sessions 目录（见工具操作）。Pi 不会发现 `.claude/skills/`，所以把 mode skill 写到 `.pi/skills/<handle>-mode/SKILL.md` 或 `.agents/skills/<handle>-mode/SKILL.md`。 |
| `architect` | runner 面板经由 **arena** skill，其 `agent` 扇出与模型别名同样适用。 |
| `arena` | 并行候选与交叉评审都是按配置别名的后台 `agent` 调用（见模型名）。 |
| `how` | 并行探索者与讲解者都是 `agent` 调用，`readonly` 按原文生效（见 Subagent 策略）。 |
| `reflect` | 三位审查者与综合者都是后台 `agent` 调用。转录查找器也能读 Pi 会话。用它本工作区的 Pi sessions 目录（见工具操作）替代 Claude Code 的 projects 目录。它会沿会话的活动分支追溯到开场 prompt。skill 文件从 `pi list` 显示的 Pi 包目录加载，而非 `~/.claude/plugins/`，所以对该目录下的读取按插件 skill 读取对待。 |
| `swarm` | 每个 worker 都是一次按配置别名的后台 `agent` 调用。给每个写入型 worker `isolation: "worktree"` 或独立的输出目录（见上面的 Subagent 策略）。 |
| `why` | 并行调查者与综合者都是后台 `agent` 调用。从 Pi 暴露给会话的工具或 `pi mcp list` 列出 MCP server，不要从 `.mcp.json` 或 `claude mcp list` 取。只有在每位调查者的完成通知都到达之后才生成综合者，因为那些通知携带着综合者要用的发现。向调查者发 `send_message` 拿不到发现，所以要等它的通知。 |

## 随附脚本

`skills/poteto-mode/scripts/` 附带 `watch-pr` PR 监视器、`orch` 存储 CLI 和 `worktree-audit.mjs`。这些脚本用 bun 和 Node.js，在 Pi 上行为一致；通过 `bash` 调用。它们需要 `bun`、`gh`，栈操作还需要 `gt`。`worktree-audit.mjs` 按 shebang 用 `node` 运行。审计用 `stat` 跟踪工作树各祖先目录里的每个链接，并按链接最终落到的目录来匹配，bun 与 node 下都一样。bun 无法解析自身路径的工作树会丢失其最近聊天并落入 `review`。悬空或成环的链接会被忽略。其他任何 `stat` 无法跟随的链接，会把该链接目录下的所有工作树归入 `review`，并给出点名该链接的警告。`worktree-audit.mjs` 在每个存在的运行时转录目录里找各工作树最近的聊天：`$CLAUDE_CONFIG_DIR`（默认 `~/.claude`）下的 Claude Code projects、`$CODEX_HOME`（默认 `~/.codex`）下的 Codex sessions 与 archived sessions，以及 `$PI_CODING_AGENT_DIR`（默认 `~/.pi/agent`）下的 Pi `sessions/` 和 pstack 扩展的 subagent 会话。在仓库路径之后传入转录目录可改为扫描其他位置。它从 `skills/reflect/scripts/find-transcript.mjs` 导入转录遍历器，所以要把 `reflect` skill 与 `poteto-mode` 装在一起。

## 指令文件

pstack skill 说“你的指令文件”时，在 Pi 上指 `AGENTS.md` 或 `CLAUDE.md`，Pi 会从工作目录和每一级父目录加载它们，外加对所有目录生效的 `~/.pi/agent/AGENTS.md`。在 Claude Code 上是 `CLAUDE.md`。
