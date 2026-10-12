---
name: principle-separate-before-serializing-shared-state
description: "当并发 actor 可能写同一个文件、分支、键或状态对象时应用。先消除共享；只有当单一共享写入者确实是必要不变量时，才做结构性串行化。"
user-invocable: false
---

# 先分离再串行化共享状态（Separate Before Serializing Shared State）

当并发 actor 可能共享可变状态时，先问他们是否真的需要同一个可变对象。不需要，就消除共享。共享是真实的，就用结构化手段强制串行：锁文件、顺序阶段、独占所有权。指令和约定不是并发控制。

**为什么：**对共享状态的并发写入会造成竞态条件——间歇出现、难以复现、调试昂贵。

**模式：**
1. **识别共享的可变状态**（双方都读写的文件、双方都 push 的分支、一方定义一方消费的 API）。
2. **默认做法：消灭共享写目标。**问：这些 actor 需要一个规范对象，还是在各自发布独立的事实？给每个 actor 自己独有的文件、键、分支或状态目录，只在读取/汇报边界合并。两个 worker 往同一个 `state.json` 里各写一个 `lastX` 字段仍是共享变更；`indexer-state.json` + `metrics-state.json` 就不是。
3. **只有当共享写目标确实是必要不变量时，才用结构化方式串行化访问**（锁文件、顺序阶段、单一写入者 actor，或原子 compare-and-swap）。把"我们需要一把锁"当作需要检查的设计坏味道，而不是默认答案。
