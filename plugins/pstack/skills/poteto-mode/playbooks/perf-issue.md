### 性能问题（Perf issue）

**测量故事由你负责。计划、审查、验证数字。** 每个修复都挂在一个测量上，不要用读源码代替测量。

1. 通过匹配的 driver skill 抓基线 trace。基线和之后每个数字都用 **benchmark-checklist** skill 审一遍。
2. 用 `how` 给假设扎根。没跑过就不要宣称性能天花板。
   按顺序尝试性能箴言，从最便宜的开始：
   1. 别做它。与其把没人用其结果的工作变便宜，不如直接停掉。
   2. 做它，但只做一次。
   3. 少做。
   4. 晚点做。
   5. 趁没人注意时做。
   6. 并发地做。
   7. 更便宜地做。

   先前的箴言达标就停。
3. 从 trace 规划修复。跨函数边界就先 `architect`。把实现委托给一个 subagent，用你配置的 perf-issue 模型（默认见 poteto-mode 的 Models 章节）。审查 diff。抓修复后的 trace。
   应用 **sequence-verifiable-units** 原则 skill：每次尝试先验证再试下一个。
4. 解析并比对产物（JSON 转 sqlite、diff）。"不确定"或表面不对不算通过，要标记出来。
5. 在 PR 里引用测量。
6. 运行 **Opening a PR**。

要的是对某个指标的持续改进而不是一次性修复时，用 Hillclimb playbook（`playbooks/hillclimb.md`）。

**回复：**基线数字、修复后数字、delta、产物路径。
