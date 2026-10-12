---
name: swarm
description: "并行派发 N 个 worker，收齐结果，返回一份报告。用于 /swarm、'swarm this'，以及并行覆盖、竞速、闯关与探索。"
---

# Swarm

在 Codex 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/codex-tools.md)，包括其中针对各 skill 的说明。

在 GitHub Copilot 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/copilot-tools.md)，包括其中针对各 skill 的说明。

并行派发 N 个 worker。它们可以各自覆盖不同的切片，也可以用同一个 brief 竞速，或两者混合。父级等待、汇总，并返回一份报告。

## 开始

在启动任何东西之前，先打开一个 todolist，每个阶段一个条目。

1. 框定
2. 并行派发
3. 汇总
4. 报告

## Phase A：框定

1. 写明完成谓词，以及 swarm 必须返回的产物或报告。
2. 选择形态。切分成多个切片，或让 N 个 worker 用相同的 brief 竞速，或两者混合。竞速或混合形态时，在派发之前先声明 `first pass`、`rank all` 或 `best-of`。
3. N 由用户给定，或根据形态推导。N 是 worker 总数，不是同时运行的数量。
4. 从 `pstack-models.md` 的 `swarm workers` 行中挑选 worker 模型。如果覆盖表或该行缺失，使用[模型](#models)中的默认值。`auto` 或 `inherit-parent` 时省略 `model`，让 worker 跑在父模型上。如果 `Agent` 工具拒绝了某个 slug，就改用默认值并说明。如果默认值也被拒绝，就从错误信息中选用同系列最接近的有效 slug。模型竞速时，事先写明每一臂的模型。
5. 当 worker 需要写输出时，给每个 worker 分配各自可写的输出位置。当 worker 要验证或度量提交时，每份 brief 都要写明确切的 SHA。度量类 brief 还要写明方法（采样次数、单个样本是什么、顺序）。worker 把两者都记入其结果。

## Phase B：并行派发

在一条消息里生成全部 N 个 worker，参数为 `subagent_type: "general-purpose"`、`run_in_background: true`，模型用第 4 步选定的（`auto` 或 `inherit-parent` 时不设置）。Claude Code 的 subagent 都运行在本机上，因此隔离来自 Phase A 分配的工作树或输出目录，而不是远程环境。

当某个 worker 必须从非默认分支开始时，在其自己的工作树中检出该分支，并在 brief 中写明工作树路径。

每份 brief 都必须自成一体。写明目标、范围、确切的切片或竞速臂、如何验证、要报告什么。报告使用 `PASS`、`ISSUES` 或 `BLOCKED`，并附证据。能证明存在缺陷的 worker 报告 `ISSUES`，并列出它能证明的每一个问题，而不是只报第一个。

如果有 worker 缺席，就以 N-1 继续并记录。

## Phase C：汇总

读取最终结果。丢弃没有记录其 brief 所要求的 SHA 和方法的结果，并把该 worker 重新生成一次。第二次仍缺失时，记一个缺口。缺口不算通过。覆盖形态下，每个必需切片都要有结果。竞速形态下，按事先声明的选择规则执行：first pass、rank all 或 best-of。不要原样粘贴 worker 的原始输出。

保留一张紧凑的结果表、逐条单行且带证据的问题，以及明确写出的缺口或缺席。

## Phase D：报告

在对话中返回一份合并的报告，包含结果表、单行问题、缺口或缺席，以及（如使用）竞速规则。

## 模型

角色默认值，由 `plugins/pstack/models.json` 生成（在该文件中修改，然后重新运行 `tools/generate.mjs`）。`pstack-models.md` 覆盖表中匹配的角色行会在运行时覆盖各项；`/setup-pstack` 负责写入它，并按运行时列出其路径。

- swarm workers: `opus`

## 推理力度

覆盖表中的角色值可以在模型名后附加推理力度，如 `opus @xhigh`。Claude Code 上的级别：`low`、`medium`、`high`、`xhigh`、`max`。哪些级别可用取决于模型。不带 `@` 的值采用表中的 `default effort` 行——一个级别或 `session`；表没有该行时用 `session`。`session` 不设置力度，因此按常规方式分派。读取模型前先去掉后缀：`inherit-parent` 或 `auto` 在任何级别下都仍省略 `model`，模型名则照常作为 `model` 传入。在 Claude Code 上，一个级别会从你本要使用的 `subagent_type` 中选出一个 effort agent。`pstack:poteto-agent` 变为 `subagent_type: "pstack:poteto-agent-<level>"`。`general-purpose` 或未指定 `subagent_type` 时，变为 `subagent_type: "pstack:effort-<level>"`。effort agent 只设置 `effort`，因此你传入的模型仍决定实际模型。在 Codex 上，把级别作为 `spawn_agent` 的 `reasoning_effort` 传入，并保留常规指令。
