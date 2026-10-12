# 给 prompt 措辞

一条 prompt 说明意图和完成的判定标准。步骤由 playbook 提供，所以几句平实的话胜过一份规格说明。

## 要写进去的

- 目标。说清哪里出了问题，或用户想要什么。
- 完成检查。它必须能判定通过或失败。"让它更好"和一段时长都不是检查。
- 要展示的证据。要求看真实命令输出、流程视频、存储值，或前后对比数字。
- 用户已知的信息。一个症状、一个复现步骤、一段日志或一个链接，都能省去 agent 的一次搜索。
- 真实的约束。"repro first"、"don't change any code yet"、"zero behavior change"、"let me review before proceeding" 各自都会改变 agent 的做法。

## 不要写的

- 具体怎么做。说清要达成什么，给 agent 留出找到更好办法的空间。
- skill 或步骤清单。手写的顺序会丢掉或打乱 playbook 本会保留的步骤。点名 skill 只用于推翻某一个选择。
- 用户对成因的猜测，除非 agent 先复述了问题。一个被说出口的猜测会收窄搜索范围。

## 先加载上下文

- 面对一份嘈杂的报告，让 agent 在做任何其他事之前，用自己的话、用平实的语言复述底层问题。误读会在任何代码存在之前就暴露出来。
- 在新对话里，用 `/recall` 找回该主题更早的工作。旧对话里存着新 agent 缺少的上下文。
- 改动不熟悉的代码之前，用 `/how` 问机制，用 `/why` 问原因。没有追出一份心智模型的 agent 会在第一个看似合理的位置修症状。
- 让 `/teach` 为某个选择论证，如 "convince me it fixes the cause and not the symptom"。论证比总结更容易核对。

## 先设计再计划

- 绝不接受第一个设计。要求给出几个方案的 prototype，UI 要附截图或视频，然后依据证据挑选。
- 让 prototype 回答悬而未决的问题。不要以对抗姿态审查一份抽象计划，因为审查者会编造从未发生的风险。
- 对于共享包或 API，先要 README 或教程，再回推到代码。文档会成为 agent 自查的靶子。
- 设计敲定之后才要计划。计划的每一步都以一个检查收尾。

## 短促跟进

- 对话已经掌握任务之后，"do it"、"continue"、"keep going until done" 就是完整的 prompt。
- 话题变了就以 "new task" 开头。否则 mode 会把这条消息当成下一步。

## 离开之前

- 说 "im going to bed" 或 "im stepping away"，agent 就会停止追问。
- 把"完成"写成每轮迭代都能运行的检查，并把该谓词交给 `/loop`。
- 要求从一个指明的基线开出干净的 worktree。
- 预先回答 agent 会停下来问的事，如 "don't ask me before committing"。
- 要求保留一份决策日志，供事后审计。
- 给一条出口："if you're truly stuck after a few hours, stop and write up why"。

## 一行纠偏

- 重申目标："i said the goal is to repro. i did not ask for a fix yet."
- 点出 principle："apply prove it works. show me the real output, not the build log."
- principle 名字之所以管用，是因为 agent 已经读过那条规则。它的回复会指出这条规则改变了哪个决定。
