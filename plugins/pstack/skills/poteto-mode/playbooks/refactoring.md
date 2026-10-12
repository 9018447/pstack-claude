### 重构（Refactoring）

通过 [poteto-mode 的 Non-negotiables](../SKILL.md#non-negotiables) 解析 driver skill。

**契约由你负责。结构变，行为不变。** 与增加行为的 Feature、纠正行为的 Bug fix 相区别。

清理中暴露出缺失的功能或真实缺陷时，把它拆出去，先针对固定契约交付结构变更。允许重新设计，但要说明并路由到 Feature。大型或横切的结构工作属于 **figure-it-out** skill。本 playbook 处理中小型变更。

1. 先固定行为契约。对受影响子系统跑 **how** skill 弄清契约，然后在任何结构移动之前写好特征测试、快照或等价性装置，把当前行为捕获下来。该区域没有覆盖时，先写好固定物再碰结构。类型检查和 lint 不是固定物。
2. 按 **principle-model-the-domain** 点出代码缺的结构。形状已经清楚且局部时，乏味的代码就保留。重塑必须删掉分支或非法状态，而不是增加间接层。
3. 点名目标形状。说明如果今天来建，模块布局、类型和调用图应该是什么样（**principle-foundational-thinking**、**principle-redesign-from-first-principles**）。目标跨函数边界时，先跑 **architect** skill 对形状做并行设计探索，再动手移动。
4. 先减后加。引入新形状之前，先删死代码、折叠单调用方包装、去掉冗余校验器、清理孤儿引用（**principle-subtract-before-you-add**）。能到达目标形状的最小变更才交付（**principle-laziness-protocol**）。"也许有用"的投机清理会被回退。
5. 以小的保行为步骤移动，每步都保持固定物全绿。API 重塑时，同一波次里迁移所有调用方并删除旧 API（**principle-migrate-callers-then-delete-legacy-apis**）。不留兼容垫片，不留新旧并行的路径。对照真实文件抽查每个重命名。重命名会悄悄漏掉字符串、散文和反向引用里的用法。把机械编辑委托给一个 subagent，用你配置的 refactoring 模型（默认见 poteto-mode 的 Models 章节），给明确范围（文件路径、被移动的名字、要守住的行为）。
6. 在真实产物上证明行为未变，而不是"它能编译"（**principle-prove-it-works**）。较大的重塑要跑等价性检查：diff 新旧输出的脚本、对回放的录制基线、或经相关 driver skill 在匹配表面上的冒烟运行。
7. 确认这个变更加了分才保留。成功的量度是读者负担下降（**principle-minimize-reader-load**）。diff 没有在某处降低读者负担，就回退。
8. 整理成小的有序提交：先一个做减法的提交，再重塑，再任何后续清理。用 **sequence-verifiable-units** 原则 skill 塑形，让每个保行为切片在下一个之前保持全绿。运行 **Opening a PR**。

**回复：**变了的结构、你据以守住的固定物、等价性证明、读者负担的变化、交付了什么回退了什么。没有新行为。
