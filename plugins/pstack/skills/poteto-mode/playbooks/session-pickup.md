### 会话接续（Session pickup）

**接续点由你负责。读前一条轨迹，不要重做。**

1. 先按[恢复存储](../references/resume-storage.md)读项目检查点。读取成功即可拿到笔记和产物，不需要上一个会话给出路径。指针缺失时，通过以下途径找到先前轨迹：Claude Code 每项目 transcript 目录 `~/.claude/projects/<encoded-cwd>/*.jsonl` 下的本地 transcript（`<encoded-cwd>` 是把工作区 cwd 里的 `/` 替换成 `-`；不要跨 `~/.claude/projects/` 的其他目录做 glob，那会越过工作区边界，读到无关项目的私人对话）、云 agent URL、或已推送的分支。检查点不可用或不完整，需要的是诊断，而不是无声回退。走 transcript 回退时，先读元数据概览和最后几条消息，再往回扫决策点。长 transcript 放进 subagent 解析，精简后的时间线留在主线程（**principle-guard-the-context-window** skill）。
2. 重建运维状态。分支和工作树、什么已经落地（`git log`、对照 base 的 `git diff`）、开放的 todo、已做的决定。用先前轨迹恢复进展。关于人类裁断的声称，遵循[关于人类决定的断言](../../why/references/epistemics.md#claims-about-human-decisions)。agent 的总结不是原始裁定。
3. 对照已完成与待办。拿已交付的对照计划的比，点名接续点，不重跑先前的复现，不重做已完成的工作。重查那些影响剩余工作的声称，但不重复已完成的调查。读恢复笔记链接的产物，包括被要求保留的问题或清单。
4. 把剩余工作路由到匹配的 playbook 并选定判定：继续执行、交付一份已完成的建议、批准或推翻先前的结论、或对一次失败的运行做事后剖析。接续 playbook 到此为止。路由去的 playbook 负责其余。
5. 在真实产物上对照最初目标验证继承来的声称（**principle-prove-it-works** skill）。先前自报通过不算证明。

**回复：**前一个 agent 停在哪、你继承了什么重做了什么（理想情况是零重做）、接续点、结果。
