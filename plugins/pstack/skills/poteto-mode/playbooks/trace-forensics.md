### 跟踪取证（Trace forensics）

**从产物出发的诊断由你负责。加载它、整形、收窄到原因、归因到源码。**

与给活进程插桩的 **Runtime forensics** 相区别。这里捕获已经存在。产物是固定数据集，读它，不要重跑。工具保持通用，让 playbook 可移植：cpuprofile 和 `.json.gz` 用 DevTools 或 trace 解析器，spindump 用文本编辑器，heapsnapshot 用你的堆工具。

1. 识别格式并用对的工具加载。大产物在 subagent 里解析（**principle-guard-the-context-window** skill），精简后的发现留在主线程。
2. 把原始产物变成可查询的形状。把 trace 或堆快照倒进 sqlite，每个样本、帧或节点一行。先到可查询形状，再开始读。
3. 收窄到原因。查占用时间最多的帧，沿调用树走到热路径。泄漏则从泄漏对象沿保留链走到 GC root。spindump 则找出卡在 CPU 上或被阻塞的线程及其等待原因。
4. 归因到源码。借产物自带的符号把热帧映射到文件、符号和行。没有源码映射的帧还不算诊断。解析符号，或者明说产物不带符号。
5. 有成对的捕获就做对照确认。diff 前后两份产物。没有时，把发现标注为该产物能支持的最强假设，而不是已确认的原因。
6. 交回带出处的诊断，没被要求就不给修复。原因查明后路由到 Bug fix 或 Perf issue。吞吐检查点保持一行：`throughput checkpoint: n/a, read-only forensics`。

**回复：**产物及格式、精简后的发现、源码位置、产物路径、成对捕获是否确认了它。
