### 调查（Investigation）

**答案由你负责。计划、路由、成文。**

调查请求是只读的。它们产出一份带出处的解释或一个建议，而不是代码变更。

1. 通过 **how** skill 路由。动机类问题再加走 **why** skill。
2. 吞吐检查点保持一行：`throughput checkpoint: n/a, read-only investigation`。
3. 产出 `how` 形态的输出（Overview / Key Concepts / How It Works / Where Things Live / Gotchas），或者当请求是在备选之间做决策时，给出一份带权衡表的建议。
4. 对回复应用 **unslop** skill。

不开 PR、不 babysit、不用 `architect`，除非调查之后紧跟代码变更。如果是，交还给用户，重新路由到 Bug fix 或 Feature。

**回复：**调查输出。"我们确定吗？"类答案要带上你的真实判断和理由。前提有误就反驳（见 Autonomy）。
