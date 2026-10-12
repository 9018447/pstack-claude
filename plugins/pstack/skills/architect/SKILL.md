---
name: architect
description: "在写代码之前勾勒类型、签名和模块结构，然后在实现填充的过程中保持参与。用于 /architect、'architect this'、'design this'，或任何直接动手写代码会锁死错误形态的非平凡工作。"
---

# Architect

在 Codex 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/codex-tools.md)，包括其中针对各 skill 的说明。

在 GitHub Copilot 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/copilot-tools.md)，包括其中针对各 skill 的说明。

先设计再实现。用 `not implemented` 函数体和伪代码勾勒类型、函数签名、类形态和模块边界。跨多个模型视角综合，再对照选定的草图填充代码。如果实现证明草图错了，就扔掉它重新设计。

## 开始

开始前先打开一个 todolist，每个阶段一个条目。

1. 摸清问题
2. 草图
3. 确认
4. 实现
5. 推翻重来

## Phase A：摸清问题

为新代码触及的每个系统建立真实的心智模型。对相关子系统运行 **how** skill。

点出几个文件名不算摸底。要产出 `how` 所要求的那份经过追踪的模型。如果设计要重新定义归属或分层，还要对现有形态运行 **why** skill，让设计依据成为约束，而不是猜测。

只有当工作真的是从零开始的 greenfield、没有任何需要集成的周边系统时，才可以跳过 Phase A。

## Phase B：草图

以 design-sketch 任务和 Phase A 的摸底产物运行 **arena** skill。把 `references/runner-prompt.md` 作为每个 runner 的 prompt 传入。每个候选产出一个按 `references/rationale-template.md` 组织的设计包。

runner 取自 `pstack-models.md` 中的 `architect runners` 行，替代 `arena runners` 行。如果表或该行缺失，使用[模型](#models)中的默认值。别名条目和被拒绝条目遵循 **arena** skill Phase A 中的 runner 规则。

设计两遍。综合之前要求至少有两个结构上不同的候选，哪怕第一个看起来已经够好。这是 **exhaust-the-design-space** 原则 skill 的具体化。要的是整体形态上的备选，而不是同一个形态内部的点状修补。

综合之前，用 [`references/design-red-flags.md`](references/design-red-flags.md) 筛查每个候选。假设下一个贡献者是一个只看得见自己打开过的文件、复制最近的示例、走能编译的最短路径的 agent。优先选择那种"从单个文件看是对的修改，对整个仓库也是对的"的设计。

在接口深度上比较可行的候选。优先选择把更多复杂性藏在更小、更简单的公共表面之后的设计。丰富的接口可以通过集中能力而不是把它分散到各层，来保持调用链短。

arena 返回一个综合后的设计包。综合决定填入设计依据的"综合决定"一节。

## Phase C：确认（可选加入）

默认行为：直接带着综合后的设计进入实现。没有人工检查点。

当调用者明确要求时才加入检查点："/architect with checkpoint"、"stop and show me before implementing" 或类似说法。此时呈现综合后的设计，并暂停等待签字确认。

无论哪种方式，综合结果都可以作为单独的 commit 交付，即 **foundational-thinking** 原则 skill 的 "scaffold first" 模式。填充期间有计划、有范围的破坏是可以接受的，依据 **outcome-oriented-execution** 原则 skill。要在实现之前对设计施加对抗性压力，就对综合后的草图运行 **interrogate** skill。

如果人对形态提出异议（在检查点中或事后），把它当作 Phase A 的证据。在写更多代码之前重新摸底并重跑 Phase B。

## Phase D：对照草图实现

用代码替换 `not implemented` 函数体，用逻辑替换伪代码。综合后的草图就是契约。

偏离草图是值得暴露的信号，不是要默默吸收的摩擦。如果某个函数需要一个草图没有预见的参数，要问：是草图错了、需求被漏了，还是实现越界了。

在关闭每个实现单元或把它的契约交给下一个 worker 之前，把已接受的偏离与保存下来的行为契约、接口和职责分配对照一遍。一旦相应的负责人或评审流程接受了某个变更，就更新现有草图和设计依据中受影响的部分，并在那里记录接受来源。从抛出错误改为返回拒绝这样的变更，必须在下一个单元开始之前更新结果契约。

对于不破坏共享契约的局部偏离，记录该决定以及设计为何仍然成立；局部变量重命名不必重写架构。未接受的变更和未解决的分歧要保持可见。当下一个 worker 会收到相互矛盾的指令时，不要宣称该单元已协调一致；也不要仅仅为了给已实现的东西找理由而修改规格。使用现有的设计产物，而不是为每个单元另立一套记录。重复出现的结构性偏离仍然会触发 Phase E。

## Phase E：架构错误时推翻重来

如果实现不断产生草图无法吸收的摩擦，就扔掉草图。不要把修补硬拧到一个错误的设计上，依据 **redesign-from-first-principles** 和 **fix-root-causes** 原则 skill。

信号是一种*模式*，不是孤立个案。征兆如下：

- 同一种形态的 workaround 在互不相关的代码中反复出现。
- 多个互不相关的边界情况全都需要特判分支。
- 类型要靠逃生舱口（`any`、强制转换、实践中总会被设置的 optional 字段）才能通过编译。
- 草图明明说状态不共享，却冒出"我们需要一把锁"的条件反射。
- 调用者必须了解抽象的内部规则才能使用它。
- 整个实现中出现两个以上同形态的独立 Phase D 偏离。

运用判断力。几个边界情况不足以判一个架构死刑。有些问题确实复杂。数据中的复杂不等于设计中的复杂。

推翻重来时：

1. 对已构建的内容重跑 **how** skill。
2. 依据 redesign-from-first-principles，把新约束当作第一天就有的假设来重新设计。
3. 依据 **subtract-before-you-add** 原则 skill，先做减法再做加法。新草图在变大之前应该比旧的更小。
4. 回到 Phase B 并重跑 arena。

## 产出

先写调用方的用法，类型草图由它推导而来。小改动交付一个包含新类型和签名的文件。较大的工作交付模块图加类型定义。设计依据随附，按 `references/rationale-template.md` 组织，包括用法草图和综合决定。

## 模型

角色默认值，由 `plugins/pstack/models.json` 生成（在该文件中修改，然后重新运行 `tools/generate.mjs`）。`pstack-models.md` 覆盖表中匹配的角色行会在运行时覆盖各项；`/setup-pstack` 负责写入它，并按运行时列出其路径。

- architect runners: `opus`, `fable`, `sonnet`, `haiku`

## 推理力度

覆盖表中的角色值可以在模型名后附加推理力度，如 `opus @xhigh`。Claude Code 上的级别：`low`、`medium`、`high`、`xhigh`、`max`。哪些级别可用取决于模型。不带 `@` 的值采用表中的 `default effort` 行——一个级别或 `session`；表没有该行时用 `session`。`session` 不设置力度，因此按常规方式分派。读取模型前先去掉后缀：`inherit-parent` 或 `auto` 在任何级别下都仍省略 `model`，模型名则照常作为 `model` 传入。在 Claude Code 上，一个级别会从你本要使用的 `subagent_type` 中选出一个 effort agent。`pstack:poteto-agent` 变为 `subagent_type: "pstack:poteto-agent-<level>"`。`general-purpose` 或未指定 `subagent_type` 时，变为 `subagent_type: "pstack:effort-<level>"`。effort agent 只设置 `effort`，因此你传入的模型仍决定实际模型。在 Codex 上，把级别作为 `spawn_agent` 的 `reasoning_effort` 传入，并保留常规指令。
