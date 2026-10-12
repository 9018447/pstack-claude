---
name: interrogate
description: "当用户使用 \"interrogate\"、\"adversarial review\"、\"multi-model review\"、\"challenge this\"、\"stress test this code\"、\"find blind spots\" 或 \"tear this apart\" 时使用。多个 LLM 审查者从各自独立的角度挑战变更。"
---

# Interrogate

在 Codex 上，先阅读[平台映射](../poteto-mode/references/codex-tools.md)（包括其中针对每个 skill 的说明），再遵循本 skill。

在 GitHub Copilot 上，先阅读[平台映射](../poteto-mode/references/copilot-tools.md)（包括其中针对每个 skill 的说明），再遵循本 skill。

为每个配置的模型派生一个 reviewer，以对抗方式审查代码变更。每个模型拿到相同的 prompt 和 rubric（评分细则）。对抗性来自模型多样性，而不是被指派的人设。

最终交付物是一份综合后的裁决。不要自动应用修改。

## 第 1 步：确定范围

根据上下文确定要审查的内容：

- 如果用户指明了具体文件或某个 diff，就直接使用
- 如果当前在 feature branch 上，运行 `git diff main...HEAD`（或相应的基础分支）获取完整变更集
- 如果用户的消息提到了最近的工作，就收集相关文件

将 diff（或文件内容）连同 reviewer 理解代码所需的周边上下文文件一起打包。

## 第 2 步：陈述意图

在派生 reviewer 之前，先明确陈述意图。从以下来源推导：

- 用户的消息
- 提交信息（commit message）
- PR 描述（如果存在）
- 代码本身

写一段清晰的话。如果对意图没有把握，先询问用户再继续。

## 第 3 步：派生 reviewer

用 `Agent` 工具在一条消息中派生所有 reviewer。使用 `pstack-models.md` override sheet 中的 `interrogate reviewers` 行（`/setup-pstack` 会列出它在各运行时下的路径），每个条目对应一个 reviewer，并按配置的条目数量增减下方的 Reviewer 标签。如果 override sheet 或该行缺失，就使用表格默认值。

| Subagent | 默认模型 |
|----------|---------------|
| Reviewer A | `opus` |
| Reviewer B | `fable` |
| Reviewer C | `sonnet` |
| Reviewer D | `haiku` |

每个 reviewer：
- `subagent_type`: `general-purpose`
- `model`: 配置的 `interrogate reviewers` 条目；没有配置行时用表格默认值。条目为 `auto` 或 `inherit-parent` 时省略 `model`，让该 reviewer 运行在父级模型上。
- `readonly`: `true`

如果 `Agent` 工具拒绝某个配置条目，就让该 reviewer 改用其所属家族的表格默认值，并说明这一点。家族按模型名称划分，例如 Opus、Fable 或 Sonnet。没有匹配的家族时，用 Reviewer A 的默认值。如果工具拒绝某个表格默认值，就查看 `Agent` 工具错误信息中的有效 slug，选一个最接近的等价项（优先同一家族、同一推理档位），用它派生，并另开一个 PR 更新默认表格。不要因 slug 问题阻塞审查。绝不要把 alias 条目当作被拒绝的 slug，也不要对它套用上述任何一种回退。

阅读 `references/reviewer-prompt.md`，并在模板中填入以下内容：
1. 已陈述的意图
2. diff 或文件内容
3. 来自 `references/rubric.md` 的审查 rubric
4. 来自 `references/code-quality-review.md` 的代码质量视角

同一份填好的模板会发给所有 reviewer，因此每个模型都会应用代码质量视角。

## 第 4 步：综合

随着结果陆续返回，构建一幅统一的图景：

1. **解析所有发现项**（出自各 reviewer）
2. **识别共识**。由 2 个及以上模型独立提出的发现项信号最强。
3. **识别单一模型的发现项**。仍值得阅读，但要相应降低权重。
4. **去重**。不同模型可能用不同说法描述同一个问题。合并它们，并注明由哪些模型提出。
5. **记录分歧**。如果一个模型指出某个问题，而另一个模型明确表达了相反意见，这是裁决时有用的背景信息。

## 第 5 步：主审判断

你是主审（lead reviewer），一名务实的资深工程师，而不是中立的汇总器。

阅读 `references/lead-judgment.md`，其中有完整框架。

用以下类别给每一条发现项归类：

- **立即处理**。在真实目标下影响正确性、安全性或可维护性的真问题。它们会阻塞一个真实的 PR。
- **值得斟酌**。有道理的观点，但你不确定现在处理它的收益能否盖过成本。值得用户注意。
- **已记录**。技术上成立但不可执行。依赖上下文、属过早优化，或就当前阶段而言影响很小。
- **已驳回**。错误的、吹毛求疵的，或缺少上下文的。附一句简要理由。

对每条发现项，写明：
- 由哪个（哪些）模型提出
- 类别（立即处理 / 值得斟酌 / 已记录 / 已驳回）
- 一句话说明归类理由

## 输出格式

按以下结构呈现裁决：

### 意图
> [第 2 步中陈述的意图段落]

### 审查者
- Reviewer [标签]：[模型名]，[N 条发现项]（每个 reviewer 一条）

### 立即处理
[应当处理的发现项。每条包括：描述、由哪些模型提出、为什么重要。]

### 值得斟酌
[值得思考的发现项。每条包括：描述、由哪些模型提出、涉及的权衡。]

### 已记录
[有效但优先级低。简要列出。]

### 已驳回
[被驳回的发现项及简要理由。]

### 共识图谱
[模型们在哪些地方一致、哪些地方分歧？这种一致 / 分歧的模式说明了什么？]

## 推理力度（reasoning effort）

override sheet 中的 role 值可以在模型名后面指定推理力度，例如 `opus @xhigh`。Claude Code 上的档位：`low`、`medium`、`high`、`xhigh`、`max`。哪些档位可用取决于模型。不带 `@` 的值取 sheet 的 `default effort` 行（一个档位或 `session`）；sheet 没有这一行时取 `session`。`session` 不设置力度，因此按常规方式派发。读取模型之前先剥掉后缀：无论哪一档，`inherit-parent` 或 `auto` 仍然省略 `model`，模型名则作为 `model` 传入。在 Claude Code 上，档位会基于你原本要用的 `subagent_type` 选用对应的 effort agent：`pstack:poteto-agent` 变为 `subagent_type: "pstack:poteto-agent-<level>"`；`general-purpose` 或没有 `subagent_type` 时变为 `subagent_type: "pstack:effort-<level>"`。这些 effort agent 只设置 `effort`，因此你传入的模型仍然决定实际模型。在 Codex 上，把档位作为 `spawn_agent` 的 `reasoning_effort` 传入，其余指令照常。
