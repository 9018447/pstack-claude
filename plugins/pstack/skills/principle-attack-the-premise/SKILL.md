---
name: principle-attack-the-premise
description: "当多个共享同一假设的修复接连失败时应用。先说出这个假设，并在尝试下一个依赖它的修复之前，选定一个能挑战它的观察手段。"
user-invocable: false
---

# 攻击前提（Attack the Premise）

当两个或更多共享同一假设的修复在同一个关口失败时，写下它们共同假定了什么。在下一个修复依赖这个假设之前，选定一个能挑战它的观察或实验。

实验要与假设对得上。两次上调超时可能都假定了请求能到达目标地址。再次上调超时之前，先核实实际到达了哪里。

当假设涉及分配不均、所有权或任务指派时，按 actor 统计资源或工作量。按照[修复根本原因](../principle-fix-root-causes/SKILL.md)测量分布、追踪指派。只有当证据把该指派与失败联系起来时，才建议重新分配、轮换或改派。分布均匀会削弱失衡假设，但不能排除共享缺陷：每个 worker 都可能以同样的速率泄漏。

有用时，按照[打造杠杆](../principle-build-the-lever/SKILL.md)保留一个可重跑的实验。不要把它变成对无关 bug 的强制普查。

本原则质疑的是关于现有系统的某个假设；[从第一性原理重新设计](../principle-redesign-from-first-principles/SKILL.md)则是围绕一个新需求重建设计。
