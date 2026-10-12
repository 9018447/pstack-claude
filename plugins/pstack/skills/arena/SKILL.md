---
name: arena
description: "针对同一个任务并行生成 N 个候选，选出一个基底，把落选者中最强的部分嫁接进去。用于 /arena、'arena this'、'throw it in the arena'，或者当对非平凡产物只做一次尝试就会把错误的形态定死时使用。"
---

# Arena

在 Codex 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/codex-tools.md)，包括其中针对各 skill 的说明。

在 GitHub Copilot 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/copilot-tools.md)，包括其中针对各 skill 的说明。

对同一个任务并行派发 N 次尝试。从头到尾读完每一个候选。选最强者作为基底。把其他候选中最好的想法嫁接进来。验证综合后的结果。

## 开始

在启动任何东西之前，先打开一个 todolist，每个阶段一个条目。

1. 框定
2. 并行派发
3. 交叉评判
4. 挑选
5. 嫁接
6. 验证

## Phase A：框定

N 个候选将收到同一个 prompt，所以 prompt 就是契约。

1. 写明每个候选要产出的产物。
2. 制定评分标准。描述*这个*任务上的成功是什么样子，然后把它拆成 3-6 条具体、可打分的标准。评分标准是 Phase D 中挑选者的工具。候选只看得到任务本身。
3. 选定 runner。使用 `pstack-models.md` 中的 `arena runners` 行。如果覆盖表或该行缺失，就按[模型](#models)中的默认值各跑一个。该行或交叉评判行中的 `auto` 或 `inherit-parent` 条目表示父模型，因此对它省略 `model`。如果 `Agent` 工具拒绝了某个已配置的条目，就让该席位改跑其所属系列的默认模型，并说明这一点。系列按模型名划分，如 Opus、Fable 或 Sonnet。没有系列匹配时，使用[模型](#models)中该单一角色的默认值。如果默认值也被拒绝，就从错误信息中选用同系列最接近的有效 slug。当 arena 覆盖多个设计方向时，多派几个。当工作主要受生成能力制约而非对判断敏感时，用同一个模型跑 N 次。
4. 分配输出路径。每个候选写到自己的位置（可能的话用 git 工作树，否则用 `/tmp/arena-<slug>/candidate-<n>/`），遵循 **separate-before-serializing-shared-state** 原则 skill。

## Phase B：并行派发

在一条消息里以 `run_in_background: true` 生成全部 N 个 subagent，每个都带上任务、共享依据材料的路径、自己的输出路径，以及产出产物并附一段简短理由的指令。

每份理由要写明该候选考虑过哪些备选方案、放弃了什么。

如果某个候选没有产出，就以 N-1 继续，并在综合记录中记下这次缺席。

## Phase C：交叉评判

等 Phase B 的全部候选完成后，从 `pstack-models.md` 的 `arena cross-judge pool` 行中选一个模型。如果覆盖表或该行缺失，就从[模型](#models)的 runner 默认值中选。优先选与父模型不同的模型系列。在该模型上生成一个只读的评判 subagent。它看到评分标准和以路径标签标识的各个候选，对每条标准打分，并推荐一个基底及其理由。它与父线程在 Phase D 的阅读并行，而不是与候选本身并行。候选还在写的时候，不要生成评判者。

## Phase D：挑选基底

挑选之前，从头到尾读完每一个候选。

逐条对照评分标准给每个候选打分，而不是凭整体感觉。与交叉评判的结果对比。对基底的共识可以确认你的选择；分歧则说明你们中有一方有偏差，或评分标准本身含糊。决定之前，把两份理由都读一遍。

挑基底的标准是：未来维护者能在哪个候选上最容易地扩展而不破坏不变量。两个感觉难分高下时，按 Laziness Protocol 优先选边界更干净或 API 更小的那个。

在基底产物旁边留一份简短的综合说明，记录选择及其理由，并附上交叉评判的结论。

## Phase E：嫁接

把每个落选候选再过一遍，找出值得移植进基底的东西。通常每个候选只有一两处有价值的信号，而不是大部分内容。

按 **redesign-from-first-principles** 原则 skill，逐个手工融合嫁接的内容。不要机械粘贴。结果必须在同一个心智模型下保持连贯。

记录嫁接了什么、来自哪个候选，以及拒绝了什么、为什么。

当 N 个候选收敛到同一种形态时，这是强烈的一致信号。在记录中注明收敛，直接交付共识形态，无需嫁接。当 N 个候选严重分歧时，说明 Phase A 框定得不够明确。重新框定并重跑，而不是把分歧取平均。

## Phase F：验证

综合产物必须经得起与其他任何输出相同的检验，遵循 **prove-it-works** 原则 skill。

如果验证暴露出 arena 没有发现的问题，要么是 Phase A 定错了（重新框定并重跑），要么是某个候选发现了它而你漏掉了嫁接（回到 Phase E）。不要敷衍掩盖。

## 产出

一份综合产物。旁边附一份简短的综合说明，写明基底、各处嫁接（及其来源候选）、被拒绝的内容、缺席的候选（如有）以及验证结果。

## 模型

角色默认值，由 `plugins/pstack/models.json` 生成（在该文件中修改，然后重新运行 `tools/generate.mjs`）。`pstack-models.md` 覆盖表中匹配的角色行会在运行时覆盖各项；`/setup-pstack` 负责写入它，并按运行时列出其路径。

- arena runners: `opus`, `fable`, `sonnet`, `haiku`
- arena cross-judge pool: `opus`, `fable`, `sonnet`, `haiku`

## 推理力度

覆盖表中的角色值可以在模型名后附加推理力度，如 `opus @xhigh`。Claude Code 上的级别：`low`、`medium`、`high`、`xhigh`、`max`。哪些级别可用取决于模型。不带 `@` 的值采用表中的 `default effort` 行——一个级别或 `session`；表没有该行时用 `session`。`session` 不设置力度，因此按常规方式分派。读取模型前先去掉后缀：`inherit-parent` 或 `auto` 在任何级别下都仍省略 `model`，模型名则照常作为 `model` 传入。在 Claude Code 上，一个级别会从你本要使用的 `subagent_type` 中选出一个 effort agent。`pstack:poteto-agent` 变为 `subagent_type: "pstack:poteto-agent-<level>"`。`general-purpose` 或未指定 `subagent_type` 时，变为 `subagent_type: "pstack:effort-<level>"`。effort agent 只设置 `effort`，因此你传入的模型仍决定实际模型。在 Codex 上，把级别作为 `spawn_agent` 的 `reasoning_effort` 传入，并保留常规指令。
