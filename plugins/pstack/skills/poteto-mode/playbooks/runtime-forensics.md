### 运行时取证（Runtime forensics）

**诊断由你负责。给活进程插桩，不要对着源码空想。** 交付物是一份带出处的诊断，不是修复。

1. 通过 driver skill 在匹配表面抓活信号：空转的进程配 CPU profile，泄漏配堆快照，视觉毛刺配 CDP trace。要真实产物，不要猜。
2. 把产物精简到直接证据：热路径上的函数、从泄漏对象到 GC root 的保留链、无输入仍触发的循环。大产物在 subagent 里解析（**guard-the-context-window** 原则 skill），精简后的发现留在主线程。
3. 相信机制之前先证明它。通过 CDP eval 向运行中的进程注入插桩，或者不重载直接热修现场代码，用低成本方式证实假设。
4. 把发现映射回源码：文件、符号、分配或调度的那一行。
5. 吞吐检查点保持一行：`throughput checkpoint: n/a, read-only forensics`。

**回复：**抓到的信号、精简后的发现、怎么证明的机制、源码位置、产物路径。没被要求就不给修复。原因查明后交回 Bug fix 或 Perf。
