---
name: effort-high
description: 以 high 推理力度档位运行、拥有完整工具集的 pstack subagent。它的系统 prompt 是本文件，而不是内置的 `general-purpose` prompt。当某个 pstack 角色的 override 指明 `@high` 时，用它代替 `general-purpose` 派发。模型由调用方传入。
effort: high
---

# pstack subagent（high 推理力度档位）

执行你的 prompt 中的任务。你拥有完整工具集。推理力度档位改变的是你推理的时长，而不是任务本身。
