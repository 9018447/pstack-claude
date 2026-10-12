---
name: no-comments
description: "启动 comment-sicko subagent，落实被采纳的发现，并为声称存在的约束提议编码方案。"
---

# 杜绝注释

在 Codex 上，先阅读[平台映射](../poteto-mode/references/codex-tools.md)（含各 skill 的附注），再遵循本 skill。

在 GitHub Copilot 上，先阅读[平台映射](../poteto-mode/references/copilot-tools.md)（含各 skill 的附注），再遵循本 skill。

启动 comment-sicko，并落实被采纳的发现。

尊重 comment-sicko 的新鲜视角。

## 范围

使用调用方指定的文件或 diff。否则使用当前分支相对基线分支（默认 `main`）的 diff，包括工作区。

## 步骤

1. 启动一个 `Agent`，`subagent_type: "pstack:comment-sicko"`。传入范围。不要复述它的规则。
2. 检查它的报告和 diff。拒绝针对应用代码的编辑、越出范围的操作、受例外保护的删除、表述失实的 `MUST KILL` 理由，以及把刻意保留的代码当作有罪的 flag。针对我们自己代码中意外情况的 Reshape flag 仍然可执行，不要恢复那些注释。一条 keep 只有在能证明它针对我们无法改变的东西时才能保留。审计被漏掉的带作用域的 lint 与 TypeScript suppression。正确性或安全类的 suppression 仍然是可执行的 `MUST KILL`。只有附带确切的例外与作用域内证据时，才恢复被删除的内容。在采纳单薄的 `IMPORTANT` 或 `do not remove` 类 kill 或 keep 之前，对其符号跑一遍 `/how` 或 `/why`。如果一条 kill 含义不明，不要恢复。如果一条 keep 被驳倒或仍含糊，删掉它。对被拒的报告：回滚并重跑其中一份，点名失败之处。第二次仍被拒，就把问题报为未决，并判定 `/no-comments` 失败。
3. 对琐碎的被采纳 flag 直接修复：删除死路径、去掉参数，或改用真正的 API。如果任何修复需要设计一个形态，就为被采纳集合及周边代码跑一次 `/architect`。止步于草图。architect 负责出形态，第 4 步负责实现。
4. 在范围内实现最小的根本原因修复。移除每一个被点名的变通方案。如果根本原因在范围之外，就落地最小的范围内修复，其余报告为未决。**principle-fix-root-causes** 和 **principle-redesign-from-first-principles** 这两个 skill 只指引意图。二者都不得作为扩大围栏或修复围栏外实例的授权。绝不外挂治标的护栏。
5. 约束型注释会写 `do not remove`、`do not change wording` 或 `talk to X before changing`。关于我们无法改变之物的 keep 予以保留。提供范围内最便宜的类型、运行时、测试或 CI lint 编码方案。等待交互式批准。无人值守和 eval 场景需要调用方预先批准。获批则先编码再删除；否则删除，把该约束报告为未决，并草拟范围外的工作。
6. 报告删除数量、恢复的注释、重跑情况、architect 草图、修复、编码方案提议、已实施的编码、未强制的约束以及其他未决工作。
