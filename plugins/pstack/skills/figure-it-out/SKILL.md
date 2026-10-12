---
name: figure-it-out
description: "当没有更窄的 playbook 适用时，设计一份可审计的 playbook：大型迁移、雄心勃勃的多部分改动，或人离开之后回头审查的工作。按任务伸缩严格程度，运行假设循环，并通过 show-me-your-work 记录决策。用于 /figure-it-out、'figure it out'、大型迁移，或没有任何更窄的 playbook 适用时。"
---

# Figure it out

当任务匹配不到任何 playbook 时，就自己设计一个。在写任何代码之前，交付物就是工作流本身：一系列按任务伸缩严格程度的阶段，运行科学方法，并留下一条人离开之后仍可审计的决策轨迹。

## 开始

打开一个 todolist，第一项是阅读 **poteto-mode** skill 的 Principles 部分。然后把下面的各个阶段作为 todo 加入。

## Phase A：框定

先摸清事实，再投入。在能说清以下几点之前，不要开始运行：

- 以可证伪谓词表述的完成定义（**prove-it-works** 原则 skill）。
- 量化的范围：大致的单元数和工作量，以及摸底时浮出的阻塞项。
- 严格程度，宁高勿低。单向门和高影响范围的要多一些，可逆的低风险步骤可以少一些。严格程度体现为关卡和产物，而不是"更努力"。

在承诺一次长时间运行之前，先呈现框定结果和权衡。可逆的工作可以继续推进（**never-block-on-the-human** 原则 skill），但数小时的运行值得设一个检查点。

## Phase B：设计工作流

分解为原子的、可独立落地的单元。按最危险的未知优先排序。脚手架和验证先于功能（**foundational-thinking** 原则 skill）。

- 动工之前先建验证 harness，并从改动前的状态采集基线，这样检查读起来就是"旧值 vs 新值"。
- 单向门式的设计决策要运行 **architect** skill（它会运行 **arena**）。形态已经具体明确的机械性工作可以跳过。对已定的设计再跑一次 arena 是过度设计（**laziness-protocol** 原则 skill）。
- 决定哪些部分并行派发。只在接缝处并行，并给每个 worker 分配自己的工作树或分支（**separate-before-serializing-shared-state** 原则 skill）。不要过度派发。
- 把设计好的阶段清单写下来。人要审查的就是这份清单。

然后执行这个设计。把它的步骤作为具体条目加入 todolist，位置在 Phase C 条目之后、Phase D 之前。每一步都在 Phase C 的循环纪律下运行，并把 Phase D 的日志穿插其中，每落地一步就记一行，而不是把整条轨迹留到最后。

## Phase C：运行循环

每个单元都是一次实验。陈述假设，做最小的改动，在真实产物上对照谓词度量，有推进就保留，没有就回退。
应用 **sequence-verifiable-units** 原则 skill，每个单元先验证再开始下一个，而不是把检查攒到最后一起做。

- 通过检查产物本身来验证，绝不凭自述。当某件事通过得太轻松时，先怀疑观察方法，再怀疑系统。
- 委派的工作要配上评判者。如果 worker 钻了关卡的空子，重置并加固契约。如果关卡本身有错，就在一次独立的变更中修好关卡，而不是绕开它。
- 结论只有 VERIFIED、NOT VERIFIED 或 INCONCLUSIVE 三种。INCONCLUSIVE 不算通过。不要隐藏否定结果。

## Phase D：保留审计轨迹

通过 **show-me-your-work** skill 记录这次运行。figure-it-out 的工作通常足够重大，值得提交这条轨迹，让审查者能在 PR 里读到它。轨迹加上 diff，才能让人回来之后信任这份工作。

## Phase E：验证并交回

在真实产品上（而不只是 harness 上）对照 Phase A 的谓词检查整体。把任何重复出现的纠正固化为一道关卡、一条 lint 规则、一个检查或一个脚本（**encode-lessons-in-structure** 原则 skill）。

**回复：** 你设计的 playbook、严格程度及其理由、决策轨迹路径、对照谓词已验证的内容，以及尚未解决的部分。
