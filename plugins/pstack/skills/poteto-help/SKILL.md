---
name: poteto-help
description: 引导用户完成 pstack 安装配置、/poteto-mode，以及为任务挑选合适的 skill、playbook 或 principle。输入 /poteto-help 加上你的问题。
---

# Poteto 帮助

回答用户关于 pstack 的问题，递给他们一条可以直接发送的 prompt，并链接答案来源文件。对于求助类问题，不要动手做工作。用户问的是怎么做，而一次 pstack 运行要花真金白银的 token，所以把 prompt 留给他们自己发。

要求干活的消息（如 "use pstack to fix this bug"）不是求助问题。阅读 [`poteto-mode`](../poteto-mode/SKILL.md) 并在其下完成工作。

本文件把各种问题映射到拥有答案的已安装 skill、playbook 和平台映射。回答前先阅读对应的源文件。源文件的指令优先于本映射表和任何上游指南——上游指南描述的是 Cursor，可能与本移植版不同。本地链接指向已安装的 plugin，因此给用户的是文件的公开副本：`https://github.com/michael-denyer/pstack-claude/blob/main/plugins/pstack/` 加上其相对于 plugin 根目录的路径。

## 弄清他们需要什么

从消息和对话中推断需求。点名了具体场景的问题（如 "which skill reviews a PR?"）直接进入对应小节。如果需求仍不明确，用以下选项问一个多选题，然后只回答他们选中的小节：

- 开始安装配置
- 用 `/poteto-mode` 开始一个任务
- 为某个场景挑选 skill
- 修复出问题的运行
- 把 pstack 变成自己的

检查会改变答案的状态，且只在确实改变时才提及：

- 对于模型或路由问题，先弄清运行时和安装类型，然后阅读 [`setup-pstack`](../setup-pstack/SKILL.md#其他运行时) 了解表的位置和该运行时如何加载它。在说明默认值还是覆盖值生效之前，先核对该配置。
- 如果项目没有 `verify` 或 `verify-*` skill 或其他应用测试框架，意味着 agent 没有脚本化的方式驱动应用。当问题涉及证明某个改动有效时，提及 `/create-verification-skill`。

当模型表缺失且这件事要紧时，询问用户是否想现在就为每个角色挑选模型和一个默认 effort。要紧的情形：用户是新手、问题涉及安装配置或成本，或答案取决于哪些模型在跑。每次对话最多问一次。如果需求也不明确，把两个问题一起问。给出两个选项：

- 现在：让他们输入 `/setup-pstack`，同时也回答他们的问题。
- 以后：回答他们的问题，并附一句说明：在他们运行 `/setup-pstack` 之前，每个角色都使用默认模型。

## 开始安装配置

1. 弄清用户的运行时，以及他们想要原生 plugin/包安装还是仅 skills 安装。阅读 [README](https://github.com/michael-denyer/pstack-claude/blob/main/README.md#install) 或[共享安装参考](https://github.com/michael-denyer/pstack-claude/blob/main/docs/reference.md#shared-skills-installation)中的对应章节，然后给出匹配的安装命令。
2. 在解释模型选择、effort、表加载或自动路由之前，先阅读 [`/setup-pstack`](../setup-pstack/SKILL.md)，包括其 Other runtimes 表。对于内置的路由 hook 或扩展，使用当前运行时表中持久化的 `session hook: off` 设置来关闭路由。
3. 按照 [`references/prompting.md`](references/prompting.md)，提供一条带目标和可判定通过/失败检查的首个任务 prompt。使用[斜杠命令参考](https://github.com/michael-denyer/pstack-claude/blob/main/docs/reference.md#slash-commands)中当前运行时的调用语法。

在给出特定运行时的指令或改造某条 recipe 之前，如适用，先阅读 [Codex 映射](../poteto-mode/references/codex-tools.md)或 [Pi 映射](../poteto-mode/references/pi-tools.md)。它们的路由章节涵盖 hook 信任、扩展加载和仅 skills 安装。对于其他运行时，使用[运行时支持参考](https://github.com/michael-denyer/pstack-claude/blob/main/docs/reference.md#runtime-support)。

如果担心成本，说明 token 花在哪里以及如何少花。pstack 在 subagent 和审查小组上要花额外的 token。重新运行 `/setup-pstack`，选择更低的 effort 或更便宜的模型。设为 `auto` 或 `inherit-parent` 的角色会使用对话所在的模型运行——当对话本身跑在便宜模型上时开销更低。更短的小组名单会跑更少的 subagent，每个条目一个。把 `/poteto-mode` 留给需要严格性的工作。

## 用 `/poteto-mode` 开始一个任务

`/poteto-mode` 把任务匹配到一个 playbook，把该 playbook 的步骤复制进 todo 列表，并在步骤需要时运行其他 skill。它跳过的步骤会以 `skip: <reason>` 留在列表里。好的 prompt 说明目标，以及如何判定完成。它不罗列 skill，因为手写的步骤序列往往会丢掉或打乱 playbook 本会保留的步骤。在帮忙措辞一条 prompt 之前，先阅读 [`references/prompting.md`](references/prompting.md)。

至于后续任务是否会自动路由，使用[开始安装配置](#开始安装配置)下的安装配置和运行时来源。在承诺之前，先确认该安装确实启用了路由。没有自动路由时，每个新任务都要显式调用 `poteto-mode`。对话中途说 "new task" 会让 mode 重新匹配一个新 playbook。关于 subagent 默认值，阅读 [poteto-mode 的 Subagents 一节](../poteto-mode/SKILL.md#subagents)和当前运行时的映射。

## 挑选 skill

默认答案是 `/poteto-mode`，它会在步骤需要时运行其余大部分 skill。当用户想要比 playbook 给的更多或更少的东西时，直接点名某个 skill。推荐之前先阅读该 skill，并给出一条示例 prompt。

| 用户想要 | Skill |
|---|---|
| 以严格流程完成任何非平凡任务 | [`/poteto-mode`](../poteto-mode/SKILL.md) |
| 了解代码现在如何工作，或新代码应放在哪里 | [`/how`](../how/SKILL.md) |
| 了解代码为何长成这样，或某个数字从何而来 | [`/why`](../why/SKILL.md) |
| 听人平实地讲解一个改动或子系统 | [`/teach`](../teach/SKILL.md) |
| 回顾自己最近在某个主题上的工作 | [`/recall`](../recall/SKILL.md) |
| 了解一个小 diff 可能对自身之外造成什么破坏 | [`/blast-radius`](../blast-radius/SKILL.md) |
| 在编写跨越函数边界的代码之前敲定类型和模块形态 | [`/architect`](../architect/SKILL.md) |
| 对同一个 brief 得到多次尝试并合并出最好的一个 | [`/arena`](../arena/SKILL.md) |
| 对多个切片并行检查，或让 worker 竞速 | [`/swarm`](../swarm/SKILL.md) |
| 让不同模型审查一个 diff 并设法将其攻破 | [`/interrogate`](../interrogate/SKILL.md) |
| 存在便宜的本地测试时以测试先行修 bug | [`/tdd`](../tdd/SKILL.md) |
| 把 TypeScript 规则应用于 `.ts` 或 `.tsx` 工作 | [`/typescript-best-practices`](../typescript-best-practices/SKILL.md) |
| 审查前剥离注释，且由没写过这些注释的审查者执行 | [`/no-comments`](../no-comments/SKILL.md) |
| 清除散文中的 AI 腔 | [`/unslop`](../unslop/SKILL.md) |
| 按标准撰写文档、RFC、README、PR 描述或提交信息 | [`/technical-writing`](../technical-writing/SKILL.md) |
| 把上一条回复用大白话再讲一遍 | [`/bro`](../bro/SKILL.md) |
| 给 agent 一种脚本化方式驱动应用并证明行为 | [`/create-verification-skill`](../create-verification-skill/SKILL.md) |
| 让验证 skill 及其功能地图与应用重新对齐 | [`/maintain-verification-skill`](../maintain-verification-skill/SKILL.md) |
| 在报告或依据某个性能数字行动之前先核实它 | [`/benchmark-checklist`](../benchmark-checklist/SKILL.md) |
| 执行大型或横切式改动，或离开后回来再审查的改动 | [`/figure-it-out`](../figure-it-out/SKILL.md) |
| 在运行期间保留决策日志，事后审阅 | [`/show-me-your-work`](../show-me-your-work/SKILL.md) |
| 为每个角色挑选模型和一个默认 effort | [`/setup-pstack`](../setup-pstack/SKILL.md) |
| 把自己的工作习惯变成一个个人 mode skill | [`/automate-me`](../automate-me/SKILL.md) |
| 把完成任务学到的经验变成 skill 修改 | [`/reflect`](../reflect/SKILL.md) |
| 防止 agent 在本仓库重复同样的错误 | [`/correct`](../correct/SKILL.md) |
| 在 pstack 中找到方向 | `/poteto-help` |

如果本目录旁边的某个 skill 目录没有出现在表中，阅读它的 frontmatter 并按其 description 路由。`principle-*` 目录在下面的 principles 部分覆盖。

容易混淆的情形：

- `/how` 解释代码做什么。`/why` 解释原因。`/teach` 运行其中一者或两者，并平实地讲解结果。
- `/arena` 给每个 worker 同一个 brief，并合并出最好的部分。`/swarm` 把工作切成切片或竞速，返回一份报告。
- `/architect` 敲定设计后立即实现。加上 "with checkpoint" 可以在它写代码之前审查设计。
- `/interrogate` 审查 diff。`/blast-radius` 查找 diff 之外的破坏，并证明让改动安全的那一个关键事实。
- `/recall` 跨最近的对话重建上下文。恢复某一个特定对话或分支属于 Session pickup playbook。
- `/figure-it-out` 设计一次严格的运行。Orchestrate playbook 运行横跨数天和多个 PR 的程序。Autonomous run playbook 把一个任务推进到完成条件。

pstack 中没有的：

- Cursor 的 driver skill 没有移植版。poteto-mode 的 Non-negotiables 中的 driver 政策指出了 Claude Code 下的等价物：`run` skill 和项目的 `verify` skill。
- `/loop` 是 Claude Code 自带的 skill，**plugin-dev:skill-development** skill 是 Claude Code 的 skill 编写指南。
- pstack 没有 orchestrate skill。Orchestrate 是 `/poteto-mode` 的一个 playbook。如果斜杠菜单里出现 orchestrate 命令，那是别的 plugin 提供的。

## Playbook 与 principle

Playbook 是 `/poteto-mode` 内部的步骤列表，不是 skill，因此没有斜杠命令。在 `/poteto-mode` 内，描述任务即可选中一个，而以下短语可以直接点名一个：

- "babysit this pr" 或 "check on pr 123" 运行 Babysit。它把 PR 推进到可合并状态就停在那里。除非用户要求 merge、land 或 ship，否则它不会合并。
- "land the stack" 运行 Shipping。
- "take over this branch" 运行 Session pickup。
- "pause safely" 运行 Pause safely。
- "full autopilot on this queue" 运行 [Autopilot-full](../poteto-mode/playbooks/autopilot-full.md)。"stack them, don't ship" 运行 [Autopilot-stack](../poteto-mode/playbooks/autopilot-stack.md)。在解释无人值守会运行什么之前，先阅读所选 playbook 的合并规则。
- "run the eval playbook" 运行 Eval。

没有 `/poteto-mode` 时，像 "babysit this pr" 这样的短语可能会启动 pstack 独立的 [`/babysit`](../babysit/SKILL.md) skill。[Playbooks 一节](../poteto-mode/SKILL.md#playbooks)列出了每个 playbook 及其适用时机。本移植版的 PR 工作流参见 [Babysit](../poteto-mode/playbooks/babysit.md) 或 [Shipping](../poteto-mode/playbooks/shipping.md)。

pstack 没有规划 skill。Claude Code 的 plan mode 可以与它并行使用。对于跨阶段或堆叠 PR 的工作，让 `/poteto-mode` 出计划会运行 [Multi-phase plan playbook](../poteto-mode/playbooks/multi-phase-plan.md)，它只写计划而不实现。对于设计问题，Prototype playbook 或 `/architect` 会先用代码敲定它。

Principle 是单条规则的 skill，`/poteto-mode` 会阅读它们并在回复中引用。用户很少直接调用某个 principle，而是用名字来施加导向，如 "apply prove it works. show me the real output."。在 Claude Code 上，`principle-*` 叶子不会出现在斜杠菜单中，`/poteto-mode` 按路径读取它们；其他运行时可能把它们列在 skill 选择器里。[Principles 索引](../poteto-mode/SKILL.md#原则)列出了它们。

## 修复出问题的运行

| 症状 | 解决办法 |
|---|---|
| mode 在几轮之后不再生效 | 通过"开始安装配置"下的来源检查当前运行时的路由配置。没有自动路由时，每个任务都要显式调用 `poteto-mode`。 |
| 一个提问被当成了上一个任务的下一步 | 说 "new task"，或说明这一轮不需要 mode。 |
| 新选的模型没有生效 | 阅读 [setup-pstack](../setup-pstack/SKILL.md#其他运行时) 和当前运行时的映射，然后核对其表的位置和加载方式。 |
| 运行成本高于预期 | 参见"开始安装配置"下的成本段落。 |
| 某个 skill 没有自动加载 | 阅读它的 description 和当前运行时的 skill 加载说明。需要时显式调用它；`/poteto-mode` 不会运行每个 skill。 |
| 并行 agent 互相覆盖 | 给每个 agent 分配自己的 worktree。 |
| 过夜运行动个不停却什么都没完成 | 阅读 [Autonomous run](../poteto-mode/playbooks/autonomous-run.md) 和当前运行时的唤醒机制。对于队列，阅读上文选定的 Autopilot playbook。给运行一个可判定通过/失败的检查。 |
| 回复凭一次绿色构建就宣称成功 | 要求看真实命令、流程、存储值或性能剖析。这就是 prove-it-works 原则。 |

对于跑偏的运行，[`references/prompting.md`](references/prompting.md) 有一行式的纠偏话术，[`references/recipes.md`](references/recipes.md) 有可改造的 prompt。

## 把 pstack 变成自己的

- [`/automate-me`](../automate-me/SKILL.md) 从用户自己的历史起草一个个人 mode skill，与 `/poteto-mode` 搭配使用。
- 会话结束后用 [`/reflect`](../reflect/SKILL.md) 把教训变成经用户批准的 skill 修改。
- `/poteto-mode write a skill for <workflow>` 运行编写 playbook。eval playbook 对 skill 改动做盲测。
- 行为失当的 skill 要在它自己的 PR 里修，不要塞进出问题的功能工作里。

## 回复

先给答案。最多给一条示例 prompt，放在代码块里，合适时从 [`references/recipes.md`](references/recipes.md) 改编，然后附上该文件的链接。除非用户要完整的地图，否则保持简短。
