# pstack 的 GitHub Copilot 工具映射

pstack skill 用 Claude Code 工具语言编写（`Skill` 工具、`Agent` 工具、`AskUserQuestion`、Claude 模型名、`~/.claude/` 路径）。在 GitHub Copilot 上是同一批文件，只是工具名、模型 ID 和路径解析不同。当 pstack skill 提到某个 Claude 工具、driver 或内置 skill、某个 Claude 模型、或某个 Claude Code 路径时，阅读本文。本文同时覆盖 Copilot CLI 与 Copilot app，两者加载同一个插件。本文仅针对 Copilot；其他运行时使用各自的等价物。

## 工具操作

| pstack / Claude 操作 | GitHub Copilot 等价物 |
|----------------------|-----------------------|
| 读取文件（`Read`） | `view` |
| 创建文件 | `create` |
| 编辑文件 | `edit` |
| 运行 shell 命令 | `bash` |
| 搜索文件内容/查找文件 | `grep` / `glob` |
| 抓取 URL | `web_fetch` |
| 搜索网页 | `web_search` |
| 调用 skill（`Skill` 工具、`/command`、`pstack:<skill>`） | `skill` 工具加裸 skill 名（`poteto-mode`，而非 `pstack:poteto-mode`）。用户在 CLI 提示符输入 `/pstack:<skill>`；在 CLI 1.0.89 上，对插件 skill 输入裸 `/<skill>` 会报未知命令。Copilot 的 prompt 只列出大型插件的部分 skill（字符预算会截掉按字母序的尾部）；不在该列表中的 skill 仍可按名字加载。 |
| 派发 subagent（`Agent`/`Task` 工具） | `task` 工具：`agent_type`、`model`、`mode`、`name`、`prompt`。 |
| 一回合内并行派发 N 个 subagent | 一次回复里发出 N 个 `task` 调用。 |
| 后台 subagent（`run_in_background: true`） | `task` 加 `mode: "background"`；完成时会收到通知。 |
| 读取 subagent 结果/向运行中的发消息 | `read_agent` / `write_agent`；`list_agents` 能找回你弄丢的 ID。 |
| 跟踪任务（todolist；`TaskCreate` / `TaskUpdate`，Claude Code 上是 `TodoWrite`） | 用 `sql` 工具查会话数据库内置的 `todos` 表（排序用 `todo_deps`）。 |
| 向人类提出固定选项的问题（`AskUserQuestion`） | `ask_user` 加 `choices` 列表，一次调用一个问题。当 `ask_user` 改用引导表单（`message` 加 `requestedSchema`，如 Copilot CLI 1.0.89）时，一个 `oneOf` 字符串属性就是选项列表。只能当单选用，因为 Copilot app 的 `ask_user` 没有多选，UI 还会自行添加自由文本选项。要多选就用连续多次提问模拟。 |
| 搜索 `~/.claude/projects/` 下的 Claude Code 转录 | Copilot 会话状态，限定当前工作区；见下文会话转录。 |

## Subagent 策略

poteto-mode 的 Subagents 一节设定了 Claude 特有的默认值（`subagent_type: "pstack:poteto-agent"`、`run_in_background: true`）。在 GitHub Copilot 上：

- 插件的 agent 以命名空间名 `pstack:poteto-agent` 和 `pstack:comment-sicko` 加载为 `task` 的 agent 类型。把 skill 的 `subagent_type` 原样作为 `agent_type` 传入。
- `subagent_type: "general-purpose"` 映射到 `agent_type: "general-purpose"`。skill 未指定类型时用 `pstack:poteto-agent`。
- `readonly: true`（审查者、探索者、批评者）映射到只读 agent 类型：读代码用 `explore`，审 diff 用 `code-review`。只读角色必须运行命令或访问 MCP 工具时，用 `general-purpose` 并在 prompt 中告知不得写文件；其 diff 仍要审查。
- `readonly: false` 或需要 MCP 工具的角色映射到 `general-purpose` 或 `pstack:poteto-agent`。
- 推理强度映射到 `task` 的 `reasoning_effort`。把角色值的 `@<level>` 后缀、否则表中 `default effort` 的级别作为 `reasoning_effort` 传入；`session` 则省略。不要派发 Claude Code 用于 effort 的 `pstack:effort-<level>` 或 `pstack:poteto-agent-<level>` agent 类型，改用 `general-purpose` 或 `pstack:poteto-agent` 加 `reasoning_effort`。
- `run_in_background: true` 映射到 `mode: "background"`。`mode: "sync"` 会阻塞你的回合；只在下一步需要结果时使用。
- skill 为某角色写明的模型（其 Models 一节、`Agent` 调用的 `model`、或用户的表行）是明确的模型指令，作为 `task` 的 `model` 传入。未配置模型的角色省略 `model`。Claude 默认值如何解析见下文模型名。
- CLI 上写入型 worker 共用这台机器，所以 **swarm** skill 的 worker 和扇出类 playbook（`orchestrate`、`autopilot-full`、`autopilot-stack`）像 Claude Code 那样用工作树隔离写入者。在 Copilot app 中改用 `create_session` 给每个写入者独立的工作树会话；见下文 App 与 CLI。
- 其余政策不变。传文件指针而非内联上下文，写入型 worker 各给一个工作树或分支，每个 subagent 的 diff 都由你亲自审查。

## 模型名

skill 在各自 Models 一节用 Claude Code 模型别名指名模型。这些别名不是 Copilot 模型 ID，Copilot 发行版也不带默认模型 ID：一个账号能用到哪些模型取决于其套餐与策略，所以由用户一次性选定。

- 模型表在 `${COPILOT_HOME:-~/.copilot}/pstack-models.md`。它位于工作区之外，直接读取会触发路径访问申请。插件的 SessionStart hook 会读取并校验它，把其中的角色行作为用户已保存的 pstack 模型选择加入会话上下文。从那个块里取角色模型，不要自己去 `view` 这张表。
- 只有当那个块和 hook 的 `sheet invalid` 或无表提示都不存在时才读这张表，例如没有 hook 的 skills-only 安装。`view`、`create` 和 `edit` 只接受字面路径，既不展开 `~` 也不展开 `$COPILOT_HOME`，所以先用 `bash` 打印表的绝对路径（`echo "${COPILOT_HOME:-$HOME/.copilot}/pstack-models.md"`），然后严格按该路径读写；不要在后面追加 `.copilot` 或任何其他片段。这样自带 `COPILOT_HOME` 的会话就不会碰 `~/.copilot`。
- 没有表、或 hook 报告 `sheet invalid`：在需要角色模型的 skill（`architect`、`arena`、`how`、`interrogate`、`poteto-mode`、`reflect`、`swarm`、`why`）之前，停下来，用 `skill` 工具加载 `setup-pstack` 并先完成它。同一会话内用它刚写入的值；之后的会话从 hook 拿。后续运行不要再问。
- 表中的角色行是用户明确的模型指令，作为 `task` 工具的 `model` 参数传入。`inherit-parent` 或 `auto` 则省略 `model`。
- 插件的 `PreToolUse` hook 为 pstack agent 强制执行这一点。表有效期间，它会拒绝 `agent_type` 以 `pstack:` 开头且 `model` 不在表值之中的 `task` 调用，拒绝理由会列出已保存的 ID。用该角色已保存的模型重试；绝不要换另一个未保存的模型重试。没有 `model` 的调用和其他 agent 类型不受影响。
- 默认最强模型的角色（`bug-fix`、`perf-issue`、`hillclimb`、`strongest judgment`）：用户选定的最强模型。
- 多模型面板（`arena`、`architect`、`interrogate`、`how` 批评者、`reflect`）：对抗信号来自模型多样性，所以用 `task` 工具的 `model` 列表从不同厂商（Claude、GPT、Gemini、Grok 等）组面板。pstack 不带默认的 Copilot 面板。如果只能接触到一个厂商，就改变推理强度，并在结论中注明多样性有所降低。

`setup-pstack` 从 `task` 工具的 `model` 枚举中列出模型，只写入它在那里见过的 ID。写完表之后，它会运行自己的 `check-sheet.sh` 脚本，套用 hook 的各项检查。

`setup-pstack` 以及编排面板的父会话，要用不低于 gpt-5.4-mini 或 Sonnet 级 Claude 模型的模型来跑。在 Haiku 级模型上，冒烟测试里约一半的情况 setup 选出了用户从未选过的模型。

## 会话路由 hook

插件的 `SessionStart` hook 在 Copilot CLI 和 Copilot app 上都运行。Copilot 通过自己的 Copilot manifest 与 hook 文件加载插件，不用 Claude Code 的那套。hook 把路由指令打印为 Copilot 注入的 `additionalContext` JSON。它读取 `${COPILOT_HOME:-~/.copilot}/pstack-models.md`，会话自己读它就要触发路径访问申请。`session hook: off` 停用注入。表通过 `check-sheet.sh` 的检查时，注入的上下文以每角色一行的形式收尾，由校验过的值重建；表的其他文本不进入上下文。未通过时，上下文写明 `sheet invalid` 并逐条列出问题。没有表时也会说明。无论哪种情况，它都要求会话在第一个按角色模型派发的 skill 之前先运行 `setup-pstack`。指令中以 `pstack:<skill>` 指名 skill；在 Copilot 上按裸名加载。

会话中缺少该指令时（skills-only 安装、丢弃插件 hook 上下文的 Copilot 版本、或被其他插件的 hook 取代），把 `setup-pstack` 所述的常设指令加进 `~/.copilot/copilot-instructions.md`，或显式请求 `poteto-mode`。

## 插件文件访问

Copilot 把文件访问限制在工作区和系统临时目录内，所以从已安装插件读取 playbook、参考或脚本会在每个会话都触发路径访问申请，`-p` 运行若无 `--allow-all-paths` 会直接拒绝。插件的 `PreToolUse` hook 批准两类调用。

- 对 `COPILOT_PLUGIN_ROOT` 内不含 `.` 或 `..` 片段的路径执行 `view`。
- 在 `COPILOT_PLUGIN_ROOT/skills/` 下按绝对路径、以文档写明的参数运行某个已注册脚本的 `bash`。已注册脚本是 `log.sh`（用 `bash` 运行）、`check-sheet.sh`（用 `sh` 或 `bash` 运行），以及 `find-transcript.mjs`、`resume.mjs`、`check-plan.mjs`、`check-playbooks.mjs` 和 `worktree-audit.mjs`（用 `node` 运行）。直接执行也可接受。hook 会核对每个脚本的参数约定：例如 `log.sh` 的六个参数里只有第一个是文件名，其余是散文文本。resume 先接受操作名，然后按需接受 `--project`、`--note` 和重复的 `--artifact` 路径，`--option=value` 与 `--option value` 两种写法都行。

每个参数都是由字母、数字和 `_ . / : = @ % + , -` 组成的普通词，或内部不含引号的单引号字符串。路径操作数不得用 `..` 上爬，且在跟随目录符号链接后必须解析到工作区内；插件内的路径走正常权限流程，这样获批的脚本就无法改写每个会话加载的上下文。文件符号链接和悬空符号链接走正常权限流程。命令中不得出现 `; | & $`、反引号、`< > ( ) \`、双引号或换行中的任何一个。每次调用只运行一条命令，不带管道或重定向。未知脚本、无法识别的参数形式、解释器不匹配，都走正常权限流程。

其余一切调用，包括以任何其他形式运行脚本、以及对插件目录树使用 `grep` 或 `glob`，都走正常权限流程。请求绕过沙箱的命令也一样，因为无论 hook 怎么答，Copilot 都会就绕过弹窗询问。插件位于工作区内、或工作区位于插件内时，hook 不批准脚本，因为会话可能先改脚本再运行。hook 不生效的场合（skills-only 安装，或 hook 被禁用），用 `--add-dir <插件目录>` 启动 CLI，或在会话里运行 `/add-dir <插件目录>`；GitHub marketplace 安装位于 `${COPILOT_HOME:-~/.copilot}/installed-plugins/<marketplace>/pstack`。

## App 与 CLI

Copilot app 加载与 CLI 相同的插件，并额外提供会话级工具。工具列表里出现 app 原语时就用它，否则用 CLI 兜底。

| pstack 需求 | Copilot app | Copilot CLI |
|-------------|-------------|-------------|
| 隔离的写入者（swarm worker、栈层级、orchestrate worker） | `create_session`，每个写入者一个工作树会话 | 每个写入者 `git worktree add`，然后把 `task` worker 指向它 |
| 周期性唤醒（`loop`、`/loop` 审查节拍、babysit 的节奏） | 在本会话用 `save_session_automation` | 每回合自己重跑该步骤，或请用户重新调用；在决策记录中写明节奏 |
| 协调多个会话或仓库（`orchestrate`、`autopilot-full`） | app 的 `orchestrate` skill 加 `send_session_message` | 用工作树做 `task` 扇出；并行 subagent 用 `/fleet` |
| 堆叠 PR（`autopilot-stack`、交付一个栈） | app 的 `pr-stack` skill，每层一个子会话 | `gt` 或 `gh`，每层一个工作树 |
| 盯 PR 直到合并（`babysit`、`watch-pr`） | 会话上的 Agent merge，或 `babysit` 加 `save_session_automation` | `babysit` 加随附的 `watch-pr` 脚本和 `gh` |
| 驱动 UI | `browser` 画布，或你的浏览器自动化 | 你的浏览器自动化，或给用户一个具体的手动检查 |

## 会话转录

Claude Code 在 `~/.claude/projects/<encoded-cwd>/` 下按项目各留一个目录。Copilot 在 `${COPILOT_HOME:-~/.copilot}/session-state/<session-id>/` 下按会话各留一个目录，所有项目混在一起：

- `events.jsonl` 就是转录。第一条记录是带 `data.context.cwd` 的 `session.start`；用户回合是 `{"type":"user.message","data":{"content":...}}`。
- `workspace.yaml` 记录会话的 `cwd`。每次转录搜索都限定当前工作区：只保留 `cwd` 为该工作区路径（或其工作树）的会话目录，再读它们的 `events.jsonl`。绝不读其他项目的会话。
- skill 说“本会话的转录”时，指的是 `events.jsonl` 包含开场 prompt 的最新匹配会话目录。

在 poteto-mode 的 playbook 中，`eval` 从 Copilot 会话状态读取候选转录，`session-pickup` 和 `worktree-cleanup` 在其中按工作区检索。`orchestrate` 和 `multi-phase-plan` 把存储放在 `${COPILOT_HOME:-~/.copilot}/orchestrate/`，而非 `~/.claude/orchestrate/`。

## pstack 引用的 driver 与内置 skill

[驱动器政策](../SKILL.md#non-negotiables)决定选用哪个 app 驱动器。这些工作流点名的 skill 与驱动器，在 Copilot 上用这些等价物：

| pstack 点名的 skill 或驱动器 | 在 GitHub Copilot 上 |
|------------------------------|----------------------|
| `run`（驱动 CLI/TUI 确认改动生效） | 通过 `bash` 亲自运行 app 并观察真实输出。 |
| 项目 UI 驱动器 | 用手头任何自动化（app 的 `browser` 画布、某个浏览器 skill）驱动 UI，或给用户一个具体的手动检查。未亲眼确认产物之前不要宣称完成。 |
| `plugin-dev:skill-development`（Claude 的 SKILL.md 编写指南） | 遵循 Agent Skills 约定：带 `name` + `description` frontmatter 的 `SKILL.md`、向 `references/` 的渐进式披露，以及 poteto-mode 的 [authoring-a-skill playbook](../playbooks/authoring-a-skill.md)。 |
| `loop`（周期性/自定节奏的再次调用，`babysit` 会用到） | Copilot 没有 `loop` skill。app 上用 `save_session_automation`；CLI 上自己按节奏重跑该步骤。 |

## 各 skill 的注意事项

受影响的 skill 入口指向这里。多数 skill 只需上面的表。下面这些还需要一条映射：

| Skill | On GitHub Copilot |
|-------|----------------------|
| `interrogate` | 每位审查者是一次 `task` 调用：`subagent_type` 变为 `agent_type`，`readonly: true` 变为只读 agent 类型（见 Subagent 策略），`model` 来自模型表。保持面板厂商各异。 |
| `setup-pstack` | 该 skill 的 Other runtimes 表写明 Copilot 表的路径和加载方式。其 [Copilot 设置问题](../../setup-pstack/copilot.md) 从 `task` 工具的 `model` 枚举列出模型，每个档位和面板席位问一个 `ask_user` 问题，按厂商分组，不推荐模型；第一个问题允许只有一个模型的套餐、或不想逐角色选的人，把所有角色跑在会话模型上。角色行完全相同；`session hook` 行同样控制 Copilot 的 hook。 |
| `architect` | runner 面板经由 **arena** skill：每个 runner 一次 `task`，模型来自表中 `architect runners` 行。 |
| `how` | 探索者与讲解者是 `task` 调用，模型用表中 `how` 角色行；批评者用只读 agent 类型（见 Subagent 策略）。 |
| `arena` | runner 与交叉评审池来自表的 panel 行；交叉评审者要选与其所评候选不同厂商的模型。 |
| `no-comments` | 派发 `task`，`agent_type: "pstack:comment-sicko"`。 |
| `swarm` | worker 是 `mode: "background"` 的 `task` 调用，各自在自己的工作树上；app 中则每个 worker 一次 `create_session`。 |
| `teach` | 并行运行 `how` 与 `why` 映射为 `task` 扇出；图像生成用手头任何图像工具，没有就跳过并说明。 |
| `why` | 可用的 MCP server 出现在你的工具列表里；没有 `mcp__` 前缀约定可扫描。 |
| `reflect` | 运行 `find-transcript.mjs <session-state directory> '<opening prompt fragment>' <workspace directory>`，session-state 用 `${COPILOT_HOME:-~/.copilot}` 下的绝对路径。省略 workspace 时默认当前目录。查找器在读 Copilot 的 `user.message` 记录之前，先拿会话头的 `cwd` 与该工作区比对，因此其他项目中匹配的 prompt 会被跳过。对话发生在相关联的工作树时，显式传入那个工作树的目录。审查意见里提到 `.claude/skills/` 和 `~/.claude/` 路径的，指的都是下文的 Copilot skill 位置。 |
| `recall` | 在 Copilot 会话状态中按当前工作区检索（见上文会话转录），而不是 `~/.claude/projects/`。 |
| `show-me-your-work` | 运行结束时的核对读取本会话的 `events.jsonl`（见上文会话转录）。 |
| `automate-me` | mode skill 位于下文的 Copilot skill 位置；转录来自上文会话转录；`plugin-dev:skill-development` 按 skill 表解析。 |
| `create-verification-skill` | 生成的 skill 在 Claude Code 上落在 `.claude/skills/verify/`；Copilot 上写到 `.github/skills/verify/`。驱动 app 的测试装置与平台无关。 |
| `maintain-verification-skill` | 并行的逐特性源码阅读器映射为 `task` 扇出；项目级 skill 位于 `.github/skills/`，不在 `.claude/skills/`。 |
| `babysit` | `loop` 与 `AskUserQuestion` 按上面的表解析；app 上节奏由 `save_session_automation` 承担。 |

## 随附脚本

`skills/poteto-mode/scripts/` 附带 `watch-pr` PR 监视器、`orch` 存储 CLI、`resume.mjs` 和 `worktree-audit.mjs`。它们用 bun 和 Node.js，在 Copilot 上行为一致；按上文插件文件访问所述的形式通过 `bash` 调用。它们需要 `bun`、`gh`，栈操作还需要 `gt`。`worktree-audit.mjs` 在 `~/.claude/projects/` 下的 Claude Code 转录、Codex 与 Pi 会话、以及 `${COPILOT_HOME:-~/.copilot}/session-state` 下的 Copilot 会话中寻找各工作树最近的聊天。在仓库路径之后传入转录目录可改为扫描其他位置。它从 `skills/reflect/scripts/find-transcript.mjs` 导入转录遍历器，所以要把 `reflect` skill 与 `poteto-mode` 装在一起。

## 指令文件

pstack skill 说“你的指令文件”或 `CLAUDE.md` 时，在 Copilot 上指仓库内的 `AGENTS.md` 或 `.github/copilot-instructions.md`，外加对所有仓库生效的 `~/.copilot/copilot-instructions.md`。Copilot 也会读仓库的 `CLAUDE.md`。Copilot 不展开用户级指令中的 `@~/` include，所以插件 hook 改为注入模型表的角色行，如上文模型名所述。

## skill 位置

pstack skill 提到 `.claude/skills/` 时，Copilot 的项目 skill 位于 `.github/skills/`（Copilot 也读 `.claude/skills/` 和 `.agents/skills/`），个人 skill 位于 `~/.copilot/skills/` 或 `~/.agents/skills/`。
