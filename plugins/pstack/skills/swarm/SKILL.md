---
name: swarm
description: "并行派发 N 个 worker，收齐结果，返回一份报告。用于 /swarm、'swarm this'，以及并行覆盖、竞速、闯关与探索。"
---

# Swarm

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
4. 当 worker 需要写输出时，给每个 worker 分配各自可写的输出位置。当 worker 要验证或度量提交时，每份 brief 都要写明确切的 SHA。度量类 brief 还要写明方法（采样次数、单个样本是什么、顺序）。worker 把两者都记入其结果。

## Phase B：并行派发

在一条消息里通过 Bash 以 `run_in_background: true` 调用 `acpx`，并行派发全部 N 个 worker。`acpx` 派发的 agent 都运行在本机上，因此隔离来自 Phase A 分配的工作树或输出目录，而不是远程环境。命令形制按全局 CLAUDE.md 的 acpx 派发约定：每个 worker 一份 prompt 文件，`--cwd` 指向 Phase A 分配的输出位置，日志经 `tee` 落到 `.agent-results/`。

当某个 worker 必须从非默认分支开始时，在其自己的工作树中检出该分支，并在 brief 中写明工作树路径。

每份 brief 都必须自成一体。写明目标、范围、确切的切片或竞速臂、如何验证、要报告什么。报告使用 `PASS`、`ISSUES` 或 `BLOCKED`，并附证据。能证明存在缺陷的 worker 报告 `ISSUES`，并列出它能证明的每一个问题，而不是只报第一个。

每个后台命令退出后，检查退出码并从日志确认 `[done] end_turn`。如果有 worker 缺席，就以 N-1 继续并记录。

## Phase C：汇总

读取最终结果。丢弃没有记录其 brief 所要求的 SHA 和方法的结果，并把该 worker 重新生成一次。第二次仍缺失时，记一个缺口。缺口不算通过。覆盖形态下，每个必需切片都要有结果。竞速形态下，按事先声明的选择规则执行：first pass、rank all 或 best-of。不要原样粘贴 worker 的原始输出。

保留一张紧凑的结果表、逐条单行且带证据的问题，以及明确写出的缺口或缺席。

## Phase D：报告

在对话中返回一份合并的报告，包含结果表、单行问题、缺口或缺席，以及（如使用）竞速规则。
