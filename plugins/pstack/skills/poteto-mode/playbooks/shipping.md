### 交付（Shipping）

通过 [poteto-mode 的 Non-negotiables](../SKILL.md#non-negotiables) 解析 driver skill。

落地的东西由你负责。一次落地一个已验证的 PR，推进之前先确认它的结果。这是 `playbooks/babysit.md` 的后半场；它需要用户的落地权限。

1. **解析 forge 和依赖链。** GitHub CLI（`gh`）是默认。如果 `command -v origin` 成功且 Origin 能解析出该仓库，就用它并记录该选择。否则记录 GitHub 回退。绝不强求 Graphite（`gt`）。自底向上捕获受影响的链：每个 head 分支及其 SHA、base 分支及其 SHA、预期的目标仓库和分支。不相干的 PR 不要碰。进场时检查挂起的请求。任何缺少第 8 步持久验证门禁的，在开始漫长审查之前取消并读回。与取消赛跑成功的合并要核对清楚。在合并、布防、rebase 或改目标之前，先读[合并与 restack 安全](../references/merge-safety.md)。
2. **独立验证每个 PR。** 每个 PR 一个 subagent，各在各自的工作树里，通过 driver skill 对父分支与 head 做真实表面演练。各返回 `PASS`、`PASS+NOTES` 或 `FAIL`，并把该判定贴到自己的 PR 上。verifier 不得写过这段代码。CI 全绿和 bot 的通过性审查不能替代这个判定。记录判定的 head SHA、base SHA、base 分支，以及 base-to-head diff 的稳定 `git patch-id`。
3. **找到连续的已验证段。** 从最低的未合并 PR 走起，在第一个没有 `PASS` 或 `PASS+NOTES` 的地方停下。报告这个上限。未验证父 PR 之上的已验证子 PR 还不能落地。
4. **动链之前先取消挂起的合并。** 弄清一次改写或改目标会影响哪些 PR，包括依赖性后代。对每个受影响 PR 执行[合并与 restack 安全](../references/merge-safety.md)里规范的 `ship-pr inspect` 和 `ship-pr cancel-pending` 操作。任何分支推送、rebase 或 base 编辑之前，要求拿到成功的 `cancelled` 结果。该命令同时处理自动请求和队列成员资格，带完整的修订校验和读回。取消失败、状态不可用、或取消期间有 PR 合并了，就停止改写，先核对真实状态。与其他拓扑写者协调，别让他们在操作期间重新布防这条链。
5. **只准备最底下的 PR。** fetch 当前主干。父 PR squash 之后，按安全参考用记录下来的旧父边界，只回放子 PR 自己的提交。用改写前捕获的远端 SHA、以显式租约发布改写。只把这一个 PR 改目标到主干。先不要准备或布防后代。
6. **重新评估证据。** head 或目标有任何变化，旧的就绪观察即失效。把当前 diff 和上下文与记录的判定比对。两个补丁只在测试、文档或 lint 配置上不同时，重建每条 lane 当时构建的东西：在判定 SHA 构建两次，在当前 head 构建一次。两次判定 SHA 构建都出现的差异、或内嵌提交 SHA 的差异，属于噪音。按差异类型判断，不按文件判断，并把每一类噪音连同其文件一起报告。只有噪音不同，该 lane 的结果就仍然有效，检查和针对变更的审查则新跑。不要复用来自 dev server 或任何没有构建输出的东西的 lane 结果，重跑那条 lane。匹配的 patch-id 可以在历史改写后保住实质性的代码审查，但不能证明该审查适用于不同的目标或已变化的依赖。行为变了或适用性存疑就重新验证。改写或改目标之后，总要重跑当前的检查和可合并性。捕获此刻被批准落地的确切 head 和目标。
7. **以服务端强制的 head 条件合并。** 立即的 GitHub 合并用 `gh pr merge <pr> --repo <owner/repo> --squash --match-head-commit <verified-head>`。不带这个条件的最后一秒读取会留下竞态。请求合并前一刻确认目标。GitHub 的 head 守卫不原子地守护 base 分支。并发改目标无法控制时，停下来解决归属。绝不声称原子目标保证。Origin 只有在其已安装的 CLI/API 证明有等价的服务端 head 条件之后才可用。不要瞎猜 flag，也不要回退到无守卫的合并。不可用时，报告该限制，改用明确解析出的受支持 forge 路径，或停在 merge-ready。
8. **只有配备持久验证门禁，才启用未来的合并。** `--auto` 和入队都是未来动作。入队时的 head 检查证明不了后来的 head 被批准过。要求仓库规则对将要落地的修订和上下文强制执行所需验证，包括独立判定和必需 CI。确认过期的批准无法授权已变更的修订。绝不为了满足这一步而改保护设置。没有那些门禁就继续盯，ready 时做一次带守卫的立即合并。要求入队的分支甚至能把一次普通的 `gh pr merge` 变成入队或自动合并。先检查该策略，并使用同样的门禁要求。绝不用 `--admin` 绕过。
9. **盯住前沿并保住它的判定。** GitHub 下，运行已安装插件下的 `skills/poteto-mode/scripts/watch-pr/watch-pr --queued-stack --stack-prs <bottom>`。Origin 下，用 `origin pr view <pr> --checks --comments` 和 `origin pr checks <pr> --watch`，然后重读 PR。把 watch 在 dynamic 模式下挂 `/loop`。不加第二个 sleep 循环。watcher 唤醒时，用 `ship-pr inspect` 把完整的落地修订（含 base OID）与批准记录比对。两种挂起合并机制都要检查。证据不再适用的过期请求就取消，并重新评估。轮询保不住两次唤醒之间的间隔；第 8 步的门禁必须在那段时间里挡住未验证的修订。

   watcher 负责 GitHub 的阻塞分类。保留 `BLOCKER` 原因并按 `playbooks/babysit.md` 路由：冲突和 `behind-base` 给拓扑 owner，线程和 CI 给 PR owner，人工批准门禁给等待。阻塞未变就不要重新布防。`WAITING`（含 `merge-queue`）是非终态。挂起的检查既不是失败也不是完成。诊断 `TIMEOUT` 和 `status-query` 阻塞；未知状态绝不放行合并。入队后必需检查转红需要干预，不是放行。
10. **推进之前确认落地。** `COMPLETE` 是核实真实状态的提示，不是目标的充分证据。读 PR 的已合并状态、最终 head、base 分支和合并提交；fetch 预期目标，确认那个合并提交在其历史里。与批准记录比对，并检查落地后的内容。入队或排期响应不是合并。任何结果与已验证落地矛盾，就停链。否则从冻结清单里移除已合并 PR，把它的旧 head 保留为子 PR 的排除边界，对新的最底 PR 从第 4 步重来。不要假设宿主把子 PR 改对了目标。
11. **停在上限。** 报告落了什么、下一个未验证 PR 需要什么。扩展已验证段是对第 2 步的一次新遍历。

**回复：**已验证段和上限、各判定及其 head/目标记录、布防或取消了什么及读回结果、确认的落地、未决状态或服务端限制。
