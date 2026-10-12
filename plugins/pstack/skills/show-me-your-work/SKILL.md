---
name: show-me-your-work
description: "为长时间运行或无人值守的工作保留一份可供审查的决策轨迹：一个 TSV 日志，每个决策一行（做了什么、为什么、证据、结果）。默认只存本地；当审查者需要这条轨迹才能信任结果时才提交入库。用于 /show-me-your-work、自主或多阶段运行，以及人离开之后回头审查的工作。"
---

# 展示你的工作

在 GitHub Copilot 上，执行本 skill 前先阅读[平台映射](../poteto-mode/references/copilot-tools.md)，包括其中针对各 skill 的说明。

只保留一份权威日志。

## 格式

单个 TSV 文件，每个决策一行。单元格保持单行。证据是指针，不是叙述。

复制 `references/decision-log-template.tsv`（表头行）来新建一份干净的日志。各列：

- **ts.** ISO8601 时间戳。
- **phase.** 阶段或工作线。
- **decision.** 选了什么或做了什么，一行。
- **why.** 用平实的话说理由。如果是某条原则促成的，就直说那条原则，不要贴行话标签。
- **evidence.** 能证明它的链接或路径：commit SHA、PR 编号、`file:line`，或产物、追踪、截图的路径。绝不要写成一段话。
- **result.** 结果或谓词状态：`tests green`、`reverted`、`pixel-diff 0`、`INCONCLUSIVE`、`open`。

下面是一个示例，措辞平实，审查者一眼就能读懂。

```
ts	phase	decision	why	evidence	result
2026-05-24T09:02:00Z	frame	counted the work first, about 100 components and roughly 75 hours	wanted to know the size before starting a long run	commit 3a9f1c2	found 5 things to sort out before starting
2026-05-24T09:40:00Z	harness	took screenshots of the old version before changing anything	so we can compare old against new and catch any visual change	scripts/snapshot.sh, baseline/	saved 120 reference screenshots
2026-05-24T11:15:00Z	widget	moved the widget styles over without changing how it looks	keep the change small and the result identical	commit 7c21e0a, pixel-diff 0	looks identical, tests pass
2026-05-24T12:30:00Z	widget	threw out a helper's work because its screenshots were blank	checked the real files instead of trusting its summary	worktree reset	reverted, tightened the instructions for next time
```

## 记录一行

写每条记录时，就当是在告诉同事你做了什么。用平实的话、具体的动作，不用 AI 腔或抽象行话（**unslop** skill 同样适用于日志文本）。

使用辅助脚本 `scripts/log.sh <logfile> <phase> <decision> <why> <evidence> <result>`。它会打上 `ts` 时间戳、首次使用时写入表头、清除混入的制表符和换行符，并给任何以 `=`、`+`、`-`、`@` 或 `"` 开头的单元格加一个单引号前缀。直接用 `printf` 追加一行也可以，但如果单元格内容来自生成文本或用户提供的文本，要当心同样那几个字节。

记录决策点和检查点，而不是每一个动作：选定的一条岔路、连同验证结果完成的一个单元、一次转向或回退及其触发原因、浮出的一个阻塞项、修好的一道关卡。循环运行时，每轮迭代一行。琐碎和不言自明的跳过。

一次运行是一段 agent 对话，包括它后续的轮次以及关于它的任何总结。一次接续、一个替换 agent 或一个新对话都开启一次新的运行。当一次运行往已有内容的日志里追加时，它的第一行 phase 为 `start`；在另一次运行的 `start` 行之后，它自己的第一行同样标 `start`。因此，一次运行在后续轮次回到某份日志时，要先读日志的最后几行，确认那之后是否有别的运行写入过。`start` 行要写明它之前那些非本次运行写入的行的 `ts` 范围，其 evidence 要点名本次运行，例如它的 agent id。phase `start` 不作其他用途。

## 日志放在哪里

默认情况下，日志是一个工作产物，不提交。放在工作目录的 `decisions.tsv`，多项工作同时进行时用 `.audit/<task-slug>.tsv`，并且不纳入 git。

只有当工作足够重大、审查者需要这条轨迹才能信任结果时，才提交它。

## 规则

- 只追加。错误的判断用一行新记录来取代它。绝不编辑或删除历史。
- 优先使用已提交脚本产出的证据，而不是临时手工做的（**encode-lessons-in-structure** 原则 skill）。

## 用转录审计日志

运行结束时、交回结果之前，检查日志是否说了实话。在 Claude Code 的按项目转录目录 `~/.claude/projects/<encoded-cwd>/` 下读取本次运行的转录。不要跨 `~/.claude/projects/` 做 glob——那会读到无关的私人对话。把本次运行的各行与实际发生的事情逐一对照。这些行的每一段都始于本次运行的某个 `start` 行（如果日志是本次运行创建的，则始于第一行），止于另一次运行的下一个 `start` 行：

- 检查每一行都对应一个真实发生过的决策或动作。
- 检查每一行的 evidence 都能解析，并且展示的内容与该行的说法一致。
- 某个影响了工作走向却没被记录的岔路、转向或被放弃的方案是一个缺口。补上它。

要修正的是日志，不是故事。审计绝不编辑或删除任何一行，哪怕是凭空编造的行。当某行既没有记录真实的决策也没有记录真实的动作，或者其说法或证据有误时，追加一行取代它，写明实际情况和一个能解析的指针。本次审计不检查本次运行各段之外的行。如果本次运行自己的工作表明其中某行有误，就像处理其他错误判断一样取代它。

## 跨模型审查轨迹

交回结果之前，用一个与完成工作的模型不同系列的模型生成一个 subagent。自我审查替代不了这一步。该 subagent 阅读审计轨迹和本次运行的转录，然后标出用户应当注意的地方。不是重做工作，而是扫描哪里欠佳或有风险。

- 记录在案的决策证据薄弱或缺失。
- 跳过的验证步骤，或转录中没有凭据却声称做过的验证。
- 事后看有风险的选择（过于仓促、范围蔓延、掩盖症状）。
- 用户粗略浏览时会漏掉的缺口。

凡产出了轨迹的运行，其每次回复都以一节 "Attention" 收尾。先单独一行写审查者的模型（`reviewed by <model>`），然后逐条列出标记，指向具体的行或时刻。"No flags" 是有效取值，模型名不是。

## 审查轨迹

自上而下阅读，顺着证据指针走，抽查核对。GitHub 会把已提交的 TSV 渲染成表格。在终端里可以用 `column -s$'\t' -t decisions.tsv` 渲染。

## 组合本 skill

其他 skill 把自己的审计轨迹交到这里，而不是另发明一套。按名称引用本 skill，把格式交给它定义。不要复述各列。
