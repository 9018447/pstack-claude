---
name: babysit
description: 盯住一个已打开的 PR：修复失败的 CI，处理直截了当的审查意见，把它推进到可合并状态。相当于 Cursor 内置 /babysit 的 Claude Code 版本。在打开 PR 之后、用户希望 agent 无需再次提示就能照看它时使用。
---

# 照看 PR

在 Codex 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/codex-tools.md)，包括其中针对各 skill 的说明。

在 GitHub Copilot 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/copilot-tools.md)，包括其中针对各 skill 的说明。

本 skill 相当于 Cursor 内置 `/babysit` 的 Claude Code 版本。实现方式是对 `gh` CLI 的循环操作，再用 Claude Code 的 `loop` skill 控制节奏。

在 poteto-mode 内部，**Babysit** playbook（[`../poteto-mode/playbooks/babysit.md`](../poteto-mode/playbooks/babysit.md)）取代本 skill：它负责模式声明、合并前沿、堆叠安全和 `watch-pr` 监视器。本 skill 仍是 poteto-mode 运行之外针对单个 PR 的独立 `/babysit` 入口。

## 何时使用

- 有一个已打开的 PR，用户明确要求保持其绿色，且你尚未处于 poteto-mode 运行中（那种情况由 playbook 负责）。
- 用户直接调用 `/babysit`。
- 打开 PR 的 subagent 不负责照看——返回父级，由父级决定。

## 步骤

1. **获取 PR 状态。**

   ```bash
   gh pr view <number> --json number,title,state,mergeable,reviewDecision,statusCheckRollup,mergeStateStatus,comments,reviews
   ```

2. **按优先级分诊。**
   - 合并冲突（`mergeStateStatus == DIRTY`）：运行 **fix-merge-conflicts** skill。只有当分支是你自己的且未共享时才 force-push。
   - 检查失败（`statusCheckRollup` 中 `conclusion: FAILURE` 的条目）：运行 **fix-ci** skill。找出失败根因；修复底层的代码或测试；提交；推送。
   - 审查意见：运行 **get-pr-comments** skill 获取摘要，然后只对真正认同的反馈采取行动。当某条意见只有一个机械性的答案——一次重命名、一个卫语句、一个格式小问题——就做出修改，并在提交信息中引用该意见。当它取决于主观判断，或者你拿不准对方在问什么时，不要猜：先放着，并回复你本来会怎么做。
   - 审查机器人的评论（Bugbot 及类似自动化）：行动前先归类为修复/驳回/询问，依据 [`bugbot-triage.md`](../poteto-mode/references/bugbot-triage.md)。对安全、数据和高严重度的发现，默认选择询问。

3. **循环。** 使用 Claude Code 的 `loop` skill 控制复查节奏。根据你在盯的东西选择间隔：
   - CI 正在运行：轮询 `gh pr checks --watch`（它会阻塞到检查结束，因此无需单独的循环间隔）。
   - 等待审查者：每 20–30 分钟一次心跳。
   - 空闲但要留意新评论：每小时一次。

4. **何时停止。**
   - 构建绿色、所有评论已解决、分支可干净合并 → 宣告就绪。
   - 你已经跑了三轮「修复 → 推送 → 复查」仍未完全变绿 → 停下来，总结还有哪些没修好，把控制权交回。
   - 下一个修复会迫使做出设计取舍 → 暂停，用 `AskUserQuestion` 交给用户决定。

5. **报告。** 总结已应用的修复、已处理的评论、暂缓的评论（附原因）以及当前 PR 状态。每个提交都引用其 SHA。

## 硬性规则

- 不要在别人可能已拉取过的分支上改写历史。如果 rebase 或 force-push 看起来在所难免，先征得用户同意。
- 不要为了让测试通过而改动测试的期望值。只有当行为确实变了、且断言钉住的是旧行为时，才修改断言。
- 绝不跳过 hooks（`--no-verify`）。
- 绝不通过把失败的检查标记为非必需来绕过它。
- 只有当所有检查为绿色且没有未解决的审查意见时，才执行 `gh pr ready`。

## 交叉引用

- 打开 PR 不会自动开始照看；在 poteto-mode 内由 Babysit playbook 接管这类请求，且只有被要求时才启动。
- 如果 diff 有争议，打开前先用 `interrogate`；一旦打开，就由 babysit 接手。
- 在这里写的任何散文（PR 评论、提交信息、状态报告）都要过一遍 `unslop`。

## 来源说明

这是 Cursor `/babysit` 的 Claude Code 等价实现，而非移植——Cursor 的实现是闭源的。本 skill 为独立撰写，有自己的行文与结构；其工作流参考了 Cursor 公开的 `/babysit` 行为。与其他 PR 工具的唯一重合是它运行的那些 `gh` CLI 命令，那是功能性调用，不是复制的文本。
