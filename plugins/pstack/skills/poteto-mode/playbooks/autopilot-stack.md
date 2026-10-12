### 栈式自动驾驶（Autopilot-stack）

**你负责的是栈，绝不是落地。以完全自主构建并验证整条队列，然后交给操作员一条线性的基础分支栈去审查和落地。** **Autopilot-full** 的姊妹篇。

1. **Owner 循环原样运行。** 为整个程序解析一次 forge。GitHub CLI（`gh`）是默认。如果 `command -v origin` 成功且 Origin 能解析出该仓库，PR 的创建、编辑、查看、watch 和合并操作都用 `origin pr ...`。否则继续用 `gh` 并记录这一回退。绝不强求 Graphite（`gt`）。每个 PR 一个后台 subagent，在它自己的工作树里，端到端负责自己的变更：构建、第一次推送、在 self-proof 之前开好 ready 的 PR、self-proof（门禁、CI、凭证）、按 `../references/bugbot-triage.md` 以怀疑态度分诊 review-bot 意见、一次 slop-strip（**deslop** skill，`/deslop`）、`/no-comments`（**no-comments** skill），以及按 `playbooks/babysit.md` 跑到全绿的 babysit。工作自包含时 owner 并行。在大约 15 分钟内，每个 owner 都按 **show-me-your-work** skill 启动一条 `decisions.tsv` 轨迹，推送第一个分支快照，并以 ready、绝非 draft 开好 PR。此后，owner 每完成一个可验证单元就再推一次自己的分支（开着 hooks，WIP 提交也可以）。让轨迹保持未提交，随报告返回。owner 也要像 Autopilot-full 第 2 步那样维护 `children.tsv`。
2. **沿唤醒链审计。** root 每小时跑一次审计 tick。把每个 tick 配置成 dynamic 模式下一个真实的 `/loop`，让它自行安排唤醒，而不是阻塞在一个 sleep 上。绝不把节奏托付给记忆或有损的完成通知。每个 tick 都先从磁盘重读本 playbook（已安装插件下的 `skills/poteto-mode/playbooks/autopilot-stack.md`），再重读常设目标，拿这两者审计当前运行，并在该 tick 内修复漂移。用通用的存活或状态探测去探每个 owner。只把副作用算作进展：提交、推送、PR 或检查的变化，以及存入 store 的报告。超过预期运行时长仍无副作用的 lane 视为卡死：立即让它停止并派出替补，不要等它体面地返回。按 Autopilot-full 第 6 步探测所有 subagent 并结束 tick。
3. **守住操作员门禁。** state-then-wait：要求陈述计划不等于 go。操作员显式 go 之后，把完整的程序目标写进常设指令，并在你的 todolist 里复述。该目标跨回合有效，直到链做完。操作员叫停时，每个 owner 立即进入零写入的暂停。
4. **每轮都验证。** 交付的代码定稿后，owner 上报 code-ready head SHA；循环全绿后，带着确切的 head SHA 上报 STACK-READY。记录每个判定的 head SHA、base SHA、base 分支，以及稳定的 base-to-head patch-id，让日后的改写可以在被审查过的上下文里比较。root 按 Autopilot-full 第 4 步验证每一轮，用 STACK-READY 替代 merge-ready。未经验证的东西不进栈。
5. **判定干净才入栈，绝不落地。** 任何 owner 都不合并、不启用自动合并、不关闭。判定干净就把该 PR 追加到那条线性基础分支栈上，按验证顺序或操作员指定的顺序。
6. **拓扑单人写，构建并行写。** owner 只推自己的分支，并上报分支末端、当前 base 和预期父分支。root 是唯一的拓扑写者。任何改写或改目标之前，遵循[合并与 restack 安全](../references/merge-safety.md)：捕获受影响的链和远端 head，取消该链的自动合并请求和合并队列成员资格（两者都要），并验证取消生效。不相干的 PR 不要碰。要把一个 PR 追加入栈，先 fetch 预期父分支，把子分支 rebase 到那个确切的父分支末端，用改写前捕获的远端 SHA 以 `--force-with-lease=refs/heads/<branch>:<captured-remote-head>` 推送，并把 PR 的 base 设为父分支。按解析出的 forge，用 `origin pr create --status open --base <parent-branch>` 或 `gh pr create --base <parent-branch>` 创建。改已有 PR 的目标用 `origin pr edit <pr> --base <parent-branch>` 或 `gh pr edit <pr> --base <parent-branch>`。只有 root PR 指向主干。绝不通过 `gt` 提交或登记这条链。
7. **在根部吸收漂移，然后重新验证动了的部分。** root fetch 当前主干并自底向上 rebase 整条链。rebase 在某个 owner 的文件上冒出冲突时，由该 owner 修自己那一段，root 推送结果。一次 rebase 会改写其上所有 SHA，使旧 SHA 上的判定作废。对每个判定 SHA 应用 `playbooks/shipping.md` 的 patch-id 规则，包括核查该判定对新 base 和新上下文是否仍然适用。不再有效或适用性存疑的，一律回到本 playbook 第 4 步重新过一遍，然后才能交付。每次改写推送后都重跑可合并性和 CI，即使 patch-id 没变。会签规则与 Autopilot-full 相同。真正新的固定值上调会触发暂停，等待 root 的新会签。吸收已落地值的漂移不算上调。
8. **交付这条链。** 交付物是一条经过验证的线性 PR 链，在解析出的 forge 里可自底向上审查，每一环都在 PR 描述或评论里带着它的 verifier 判定。由操作员审查并落地，用自己的点击，或启用 merge-when-ready。

**在两个自动驾驶模式之间选择。** PR 相互独立且落地权限已授予时，用 Autopilot-full。操作员想在落地前审查、工作有先后或耦合、或合并权限未授予时，用 Autopilot-stack。

**回复：**栈根和栈顶的链接、每条链接一行的判定摘要，以及任何被搁置或排除的项及其原因。
