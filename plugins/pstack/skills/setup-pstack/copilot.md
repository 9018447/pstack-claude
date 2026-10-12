# 在 GitHub Copilot 上安装配置 pstack

在 GitHub Copilot 上，本文件替代 [setup-pstack](SKILL.md) 步骤 1、3、4 中的模型、力度和 hook 问题，步骤 6 中的表头，以及步骤 7。步骤 2、5、8、9 仍然适用。pstack 不附带 Copilot 模型默认值，因此表中的每个模型都来自用户的回答。绝不替用户挑一个他们没有选过的模型，也绝不把[模型](SKILL.md#模型)中的 Claude Code 名称或步骤 6 的值写进 Copilot 表。

在至少不弱于 gpt-5.4-mini 或 Sonnet 级 Claude 模型上运行安装配置。在 Haiku 级模型上，冒烟测试中约一半的安装配置会替用户选中他们从未选过的模型。

## 提问方式

Copilot 的 `ask_user` 每次调用只接受一个问题，带固定的选项列表。该列表是一个 `choices` 列表；当 `ask_user` 采用引导表单时，则是 `requestedSchema` 的一个 `oneOf` 字符串属性。它的 UI 会自动附加一个自由文本选项。把它当作单选处理，因为 Copilot 应用的 `ask_user` 没有多选。每个模型问题都通过 `ask_user` 加 `choices` 列表来问。绝不把模型问题合成一个开放问题来问（比如哪些角色要改、改成什么），也绝不把两个问题捆在一次调用里。用连续的单选问题模拟多选，如下面的小组槽位那样。

- 不要提议、预选任何模型，或给任何模型标 `(Recommended)`。首次安装配置没有可推荐的默认值。
- 重跑时，把步骤 2 保存的该问题取值放在第一位，标注 `(current)`。选中它即保持该值。
- 键入的回答只有当它是检测到的模型 ID 或 `inherit-parent` 时才算数；否则重新问同一个问题。
- 用户在请求中已经给出的回答算数。只问它没有覆盖的问题。
- 当 `ask_user` 不可用（`-p` 运行或 `--no-ask-user`）而模型问题仍未解决时，不要替用户做选择，也不要写表。告诉用户在交互式会话中运行 `setup-pstack`，并把本会话的各角色按 `inherit-parent` 运行。

## 当前状态

在 Copilot 上，步骤 2 的保存值就是 plugin hook 放进上下文的角色行。当上下文说明这个 Copilot home 还没有 pstack 模型表、或表无效时，就是没有。只有当这些都不在上下文中时（如仅 skills 安装），才读取该表。不要用 `bash` 去探测表或其目录是否存在。每个这样的命令都会触到工作区之外的路径并请求授权。只要 Copilot 在运行，`${COPILOT_HOME:-~/.copilot}` 就存在，因此不要创建它。

## 表头

Copilot 表在该表头之下使用步骤 6 的角色行和设置，替代步骤 6 的那段说明，因为每个角色都保留自己的行，而 `check-sheet.sh` 正是检查这一点：

```markdown
# pstack model configuration

Per-role model choices for pstack skills on GitHub Copilot, written by setup-pstack. Every role keeps its line; rerun setup-pstack to change one. A value of `inherit-parent` or `auto` runs that role on the parent session's model (the `task` call omits `model`); an alias entry in a panel list still counts toward that panel's fan-out. A model may carry a reasoning effort, as in `gpt-5.5 @xhigh` (levels: low, medium, high, xhigh, max), which the `task` call passes as `reasoning_effort`. `default effort` sets the level for a value without one; `session` keeps the parent session's effort. `session hook: off` stops the SessionStart hook from injecting the poteto-mode mandate; any other value, or no line, leaves it on. `panel vendors: any` records that the user kept a panel whose models come from one vendor.
```

## 检测模型

检测集合就是 `task` 工具的 `model` 枚举，完整 ID 与枚举所列一字不差。绝不把某个 ID 缩写成系列名。如果本会话没有 `task` 工具或其枚举不可见，就把每个角色都写 `inherit-parent`，跳过模型问题，并告诉用户在带 `task` 工具的会话中重跑 `setup-pstack`。[模型](SKILL.md#模型)中的 Claude Code 名称和步骤 6 表形态中的值都不是 Copilot 模型 ID；绝不把它们写进 Copilot 表。

按厂商把检测到的 ID 分组，依据是每个 ID 第一个连字符之前的文本。`claude` 是 Claude，`gpt` 是 GPT，`gemini` 是 Gemini，`grok` 是 Grok，`kimi` 是 Kimi，其他任何 ID 归入 Other。同一厂商内保持枚举顺序。

## 选择单个模型

下面的每个模型问题都用两次 `ask_user` 调用选出一个值，这样任何选项列表都不必装下整个枚举：

1. **厂商。** 每个厂商一个选项，附其模型数量，如 `GPT (12 models)`，然后是 `inherit-parent (run on the session's model)`。只有一个模型的厂商改为直接显示该模型的 ID，选中它问题即结束。
2. **模型。** 该厂商的 ID，然后是 `Back to vendors`。

当检测集合加 `inherit-parent` 共 8 个选项或更少时，跳过厂商一步，在同一个问题里列出所有 ID。`auto` 在 pstack 里与 `inherit-parent` 含义相同，因此不作为单独选项；已保存的 `auto` 在重跑时显示为 `auto (current)`。

## 按层级划分的角色

下面的每个层级问题会写入其行中的每个角色。小组行的各角色各自取整个小组列表。

| 层级 | 角色 |
| --- | --- |
| 默认 | `feature, refactoring`, `judgment and prose`, `how explorer`, `how explainer`, `why investigators`, `why synthesizer`, `reflect tooling`, `reflect judgment, divergent, synthesizer`, `swarm workers` |
| 最强 | `bug-fix`, `perf-issue`, `hillclimb`, `strongest judgment` |
| 小组 | `arena runners`, `arena cross-judge pool`, `architect runners`, `interrogate reviewers` |

## 问题顺序

按此顺序提问。每个模型问题都是上面的厂商加模型两步；其他每个问题都是一次 `ask_user` 调用。

0. **会话模型。** "本会话的所有 pstack 角色都用会话模型运行吗？"，选项为 `Yes, use the session's model for every role` 和 `No, choose models by tier`。这适用于只提供单一模型或只有自动选择的方案，以及不想做按角色选择的用户。重跑时，把与已保存表匹配的选项放在第一位，标注 `(current)`。选 Yes 则跳过问题 1 到 6 和模型检测。把每个角色行都设为 `inherit-parent`，每个小组角色给三个 `inherit-parent` 条目。问问题 7 和 8，然后在步骤 8 中说明小组的多样性降低了、小组条目只能靠推理力度区分。这条路径不需要 `panel vendors: any` 行，因为只含 `inherit-parent` 的小组无需厂商检查。选 No 则继续回答下面的问题。
1. **默认模型。** "默认模型：运行 <默认行中的角色>。"它写入默认行中的每个角色。
2. **最强模型。** "最强模型：运行 <最强行中的角色>。"它写入最强行中的每个角色。
3. **小组模型 1/3**，然后 **小组模型 2/3**，再 **小组模型 3/3**，作为三个独立的问题。"小组模型 N/3：小组每个模型跑一个 subagent，来自不同厂商的模型能抓住不同的错误。"在第 2 和第 3 个槽位，先列出尚未进入小组的厂商，再列出其余，然后是 `inherit-parent`。不要提供已在小组中的模型。
4. **更多小组模型。** "添加第 4 个小组模型？"，第一个选项为 `Done`，第二个为 `Add a 4th`。选择添加则用同样方式再问一个槽位，然后再问是否要第 5 个。最多提供到 5 个模型。
5. **厂商检查。** 当小组的模型 ID（不计 `inherit-parent`）全部来自同一厂商、且检测到不止一个厂商时，问"小组是单一厂商（Claude）的，它的交叉检查会共享盲区。"，选项为 `Pick the panel again` 和 `Keep it anyway`。重新挑选则回到小组模型 1。`Keep it anyway` 会在 `session hook` 行之后写入 `panel vendors: any` 行。当只检测到一个厂商时，跳过此问题，写入 `panel vendors: any`，并在步骤 8 中说明小组的多样性降低了。只含 `inherit-parent` 的小组无需检查。
6. **单独覆盖。** "要覆盖某个单独的角色吗？"，第一个选项为 `No, write the sheet (Recommended)`，然后每个层级行一个选项，标签中带上该行的当前值，如 `Strongest (<its model ID>)`。选中某行会问要改该行中的哪个角色，然后按[选择单个模型](#选择单个模型)的方式为该角色问一个模型，其当前值放第一位并标注 `(current)`。小组角色则改为按问题 3 到 5 的方式询问其列表的各槽位。每次覆盖之后重新问这个问题，直到答案是 `No, write the sheet`。
7. **Session hook。** "保留把任务路由到 poteto-mode 的 session hook 吗？"，选项为 `On (default)` 和 `Off`。重跑时，保存的值放第一位并标注 `(current)`。
8. **默认力度。** "pstack subagent 的默认推理力度？"，第一个选项为 `session (keep the parent's effort)`，然后是 `low`、`medium`、`high`、`xhigh` 和 `max`。它写入 `default effort` 行。重跑时，保存的值放第一位并标注 `(current)`。不要按角色询问力度；角色值上已保存的 `@<level>` 后缀原样保留。

问题 3 到 5 得到的小组会按槽位顺序写入每个小组角色。重跑时，每个层级问题的保存值取其行中的第一个角色，小组模型 N 则取第一个小组角色的第 N 个条目。保存值与其问题的保存值不同的角色保留自己的值，问题 6 会把它显示出来。

## 写入并检查

按步骤 5 所述校验。Copilot 的文件工具既不展开 `~` 也不展开变量，所以先用 `bash` 里的 `echo "${COPILOT_HOME:-$HOME/.copilot}/pstack-models.md"` 打印表的绝对路径，然后在一次工具调用中把整份表写到这个路径，这样写入至多请求一次路径访问授权。

然后通过 `bash` 运行 `sh <本 skill 目录>/scripts/check-sheet.sh`，传入目录的绝对路径，不带参数。它像 plugin hook 在会话开始时那样检查 Copilot 表：每个角色都有一行，每个条目都是 `inherit-parent`、`auto` 或带可选 `@<level>` 的模型 ID，并且每个小组命名来自两个厂商的模型，除非表中有 `panel vendors: any`。它打印 `sheet ok`，或打印 `sheet invalid:` 加每个问题。出现 `sheet invalid` 时，修正那些行并重新写入整份表，然后重跑检查。plugin hook 会在无提示的情况下批准这次检查。

本会话余下时间使用你刚写入的值；不要把表读回来。后续会话从 plugin hook 获取这些值，不会再问。

## 接入

不要添加 include 行：Copilot 不展开用户指令中的 `@~/` 路径，而 plugin hook 会在会话开始时注入表中的角色行。如果 hook 开着但本会话的上下文缺少路由强制指令（以 `You have pstack.` 开头的块），说明它被另一个 hook 或仅 skills 安装顶掉了。此时提议把下面这条长期指令追加到 `~/.copilot/copilot-instructions.md`：

```text
pstack: for a task that touches more than one file, changes a signature other files call, involves a design choice, or is a bug with an unknown cause or a performance issue, load the poteto-mode skill and follow it. Resolve Claude tool and model names through poteto-mode's references/copilot-tools.md; role models are in ~/.copilot/pstack-models.md.
```
