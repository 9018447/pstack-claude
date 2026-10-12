---
name: automate-me
description: "用于 \"automate me\"、\"create/update/refresh my -mode skill\"、\"turn/capture my preferences or working style into a skill\"，或希望 agent 遵循用户工作方式之时。通过 plugin-dev:skill-development + unslop 起草或修订个人 -mode skill，可选地从最近的会话记录中提取新鲜证据。"
---

# Automate me

在 Codex 上，遵循本 skill 之前，先阅读[平台映射](../poteto-mode/references/codex-tools.md)，包括其中针对各 skill 的注意事项。

在 GitHub Copilot 上，遵循本 skill 之前，先阅读[平台映射](../poteto-mode/references/copilot-tools.md)，包括其中针对各 skill 的注意事项。

一套引导式流程，把用户的工作习惯变成 agent 会遵循的 skill。产出是一个为该用户量身定制的 `-mode` skill（例如 `jay-mode`、`priya-mode`）。

本 skill 编排另外三者：一个内联的挖掘环节（见步骤 1）、**plugin-dev:skill-development** skill（负责撰写）和 **unslop** skill（负责文风纪律）。它只负责安排顺序，不取代它们。

## 流程

### 0. 检查是否已有 skill

递归查找匹配用户 handle 的 `.claude/skills/**/*-mode/SKILL.md` 和 `~/.claude/skills/*-mode/SKILL.md`。mode skill 可以放在个人类别目录（`.claude/skills/<handle>/`）里，不一定只在顶层。如果已存在一个，用 `AskUserQuestion` 确认意图（除非用户已经说了 "update my skill" 之类的话）：

- 更新已有 skill（重复运行时的默认选择）
- 从零新建（少见，动手前先问为什么）

更新模式会改变流程的其余部分：

- 步骤 1 只挖掘该 skill 上次编辑之后的历史（`git log -1 --format=%cI <path>`）。
- 步骤 2 问的是有什么变化或缺失，而不是要从零采集什么。
- 步骤 4 原地编辑现有文件。保留用户没有推翻的小节。用新证据修订相应小节。只为真正新增的规则添加新小节。

### 1. 挖掘用户的历史

扇出之前先定位当前工作区的会话记录。Claude Code 把它们存放在 `~/.claude/projects/<encoded-cwd>/*.jsonl`，其中 `<encoded-cwd>` 是工作区工作目录把 `/` 替换成 `-` 后的结果。只使用这个路径。不要跨 `~/.claude/projects/` 全局匹配。那会越过工作区边界，读到无关项目的私人对话。

在该范围内调查最近的 agent 对话，寻找反复出现的模式。运行多个并行 subagent，分片覆盖历史（例如最近 2-4 周切成 3 片，让每片都有足够材料）。每个分片挖掘 subagent 从父级提供的工作区限定路径读取会话记录，寻找下列信号，并返回一份简短的结构化清单，列出它看到的模式并附证据指引。值得搜寻的默认信号：

- 回复偏好（长度、语气、格式、"dumb it down" 之类的纠正）
- 委派习惯（subagent、模型、专门工作流、并行度）
- 验证姿态（"完成"意味着什么、单元测试还是现场复现、由谁审查）
- 代码与文字纪律（风格、引用的原则、lint/格式化工具）
- 流程约定（worktree、提交、PR、审查/合并工具）
- 元偏好（任务中途修 skill、提议新 skill）

提升某个信号之前先跨分片交叉核对。出现在 2 个及以上分片中的模式是高置信度的。孤立信号很弱，通常直接丢弃。

### 2. 直接询问用户

挖掘会漏掉尚未出现过的意图。使用 `AskUserQuestion` 工具（结构化多选），而不是让用户从零开始打字。

形态：一到两个问题，每个 4-6 个选项，类别问题用 `allow_multiple: true`。先从宽泛的问题开始（"Which areas matter most?"），再就选中的领域用具体选项追问。结构化轮次结束后，用一个自由发挥的聊天问题兜住选项没覆盖到的内容。

不要一口气甩出 20 个问题。

### 3. 归类发现

把汇总的信号归入各小节。常见的小节（只列用得上的）：

- **回复风格**：长度、语气、格式。
- **自主性**：多大程度上不必先问、MCP 工具使用。
- **先理解**：界定或调查一个改动时优先使用哪些 skill。
- **Subagent**：默认设置、并行度、模型与任务的匹配、专门工作流。
- **文字 / 代码纪律**：原则、lint 工具、风格指南。
- **审查与验证**：复现姿态、验证 skill、实测工具。
- **流程**：git worktree、提交、PR、审查/合并工具。
- **Skill**：写 skill 的习惯、先修 skill 再继续、提议新 skill。

**poteto-mode** skill 展示了这种形态。读它是为了把握颗粒度。不要照抄它的内容。用户的规则不等于 poteto-mode 的规则。

### 4. 起草 skill

使用 **plugin-dev:skill-development** skill 来撰写。放置位置：

- 路径：已有 mode skill 的类别保持不变。新的 mode，若仓库已为该 handle 建立了个人类别目录，则使用 `.claude/skills/<handle>/<handle>-mode/SKILL.md`。否则默认放在项目的 `.claude/skills/<handle>-mode/SKILL.md`（若用户偏好个人 skill，则放 `~/.claude/skills/<handle>-mode/`）。
- Handle：用户的名字或其选定的标识。
- Frontmatter 的 `description`：以他们的名字 + `/<handle>-mode` + "work in their style" 触发，不要用 "write code" 或 "review PR" 这类泛化关键词。
- Frontmatter 格式：遵循 `plugin-dev:skill-development` 的 YAML 规则。`description` 保持为单个 YAML 标量。当标点或换行有需要时，用引号包起来，或使用 `description: >-` 加缩进续行。
- Frontmatter 默认 `disable-model-invocation: true`。只有当用户明确希望自己的 mode 在每一轮都生效时才不这样设。

### 5. 打磨文字

对每一行应用 **unslop** skill 和 `plugin-dev:skill-development` 的写作指南。

把草稿拿给用户看并听取反馈。预计要多轮迭代。狠心删减。mode skill 不是手册。

### 6. 落地

在基于 main 的 worktree 中工作。提交并开 PR。不要直接推到 main。

## 护栏

- **不要过拟合到单次对话。** 只说过一次、另一次又被推翻的偏好是噪音。固化之前要求有多个实例。
- **不要耍聪明。** 复述其他 skill 的内容、生造比喻、或为 agent 读者写"诗意"的文字，只有成本没有收益。保持可操作性。
- **引用，不要内联。** 用户依赖的其他 skill 应以路径引用的形式出现，而不是粘贴摘录。他们在别处维护的原则文档同理。
- **保持小节精简。** 只有当用户在该方面有具体的、非默认的规则时才添加小节。"清晰沟通"不构成一节。"段落要短。比较选项时用表格。只有各项真正并列时才用列表。"才算。
- **命名保持通用。** 祈使句里用 "the user" 或 "the human"，不要用作者的名字。
- **不要强求对称。** 如果用户没有值得写下来的流程规则，就整个跳过流程小节。

## 评估

`-mode` skill 是主观产物。`plugin-dev:skill-development` 式的测试/迭代基准循环在这里用不上。和用户做主观感受核对：读起来像不像他们本人？有没有漏掉什么？然后就交付。

只有当该 skill 的触发准确率在实践中真的成了问题时，才运行 description 优化循环。

## 何时不适用

- 用户想要任务专用的 skill（不是工作习惯）：单用 `plugin-dev:skill-development`，无需挖掘。
- 用户想记录单一窄流程（例如 "how I write commit messages"）。那是普通 skill，不是 mode skill。
