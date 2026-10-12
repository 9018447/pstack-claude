# 合并与 restack 安全

将本参考与 [Shipping](../playbooks/shipping.md) 配合使用，并在 [Autopilot-stack](../playbooks/autopilot-stack.md) 中做拓扑变更之前使用。继续由现有 watcher 负责 CI 与阻塞项分类。这些操作增加的是版本与目标检查；它们不授予合并权限。

## 读取两种待定机制

使用已安装插件的 `skills/poteto-mode/scripts/watch-pr/` 目录下的 `ship-pr`。它负责 GitHub 传输、解析、取消顺序和回读。watcher 与该命令共享同一个 `LandingRevision`，其中包含仓库、PR 编号、head OID、基础分支和 base OID。

```sh
ship-pr inspect --repo "$owner/$repo" --pr "$pr" > "$record_file"
ship-pr cancel-pending --record "$record_file"
```

命令不在 PATH 上时，用完整路径运行已安装的命令。inspect 会输出 `kind: inspected` 和解析后的落地记录，包含两种待定机制以及（若存在）合并提交。把该记录与验证证据一起保存。取消操作接受已保存的记录，重读当前状态，在存在时禁用 auto-merge，重读合并队列成员关系，必要时执行出队，并验证在同一打开的落地版本上两种机制都已消失。它不合并、不推送、不改目标分支，也不授予落地权限。

只有退出码 0 且 `kind: cancelled` 才允许执行计划中的拓扑操作。`changed`、`not-open` 和 `still-pending` 返回退出码 1 并附带观察到的记录。`unavailable` 返回退出码 1 并附带读取或变更失败的详情。字段缺失或 API 不受支持绝不等于请求不存在。改写之前先核实这些结果；不要为了绕过不一致而替换已保存的记录。

先厘清受影响的依赖链，并与负责该拓扑的写入方协调。对每个受影响的 PR 都执行 inspect 和取消，包括上下文将改变的下游 PR；不要动无关的 PR。取消只是观察到的事实，不是阻止其他行为者随后重新开启的锁。如果状态发生变化，停下来核实。Origin 必须通过其已安装的服务提供等价的经过验证的操作；本命令是 GitHub 专用的，不得宣称为 Origin 提供支持。

## 保护并发写入与子级变更

改写之前，先用 `git ls-remote --exit-code origin "refs/heads/$branch"` 捕获远端分支 SHA，并验证返回的确实是指定分支。把该 SHA 记入操作记录。仅凭隐式租约或之前的一次读取不够；后台 fetch 会移动跟踪分支。

确认父级 squash 已落到预期目标后，fetch trunk，并找出本子级当初所基于的、已记录的旧父级 tip。验证它是子级的祖先，并检查 `old-parent..child` 确认该范围只包含子级的工作。若不是，先重建边界再继续。绝不要从父级的新 squash 提交去推断。

```sh
git merge-base --is-ancestor "$old_parent_tip" "$child"
git rebase --onto "$trunk_tip" "$old_parent_tip" "$child"
git push --force-with-lease="refs/heads/$child:$captured_remote_head" \
  origin "HEAD:refs/heads/$child"
```

在子级的干净工作树中运行 rebase，此时 `HEAD` 就是准备好的子级。这样会排除父级的旧提交。检查产出的 diff 和内容，重新评估审查意见是否仍然适用，并在新 head 上运行检查。如果租约拒绝了推送，先 fetch 并理清并发的工作；不要刷新租约后盲目重试覆盖。只有在取消得到验证之后才能改目标分支。准备后续层级时，为每个余下的子级保留已记录的边界。

## 服务侧的防护手段

GitHub 的即时合并 head 条件是 `gh` 的 `--match-head-commit`、GraphQL `mergePullRequest` 的 `expectedHeadOid`，或 REST 合并端点的 `sha`。使用其中之一，并携带经过验证的确切 SHA。这些都没有提供预期基础分支条件。在紧邻合并前后观察 base 并协调改目标；不要声称这些观察是原子的。

合并队列或自动请求可能活得比它入队时的版本更久。只有当仓库现有规则会对最终版本和合并上下文强制执行所需验证时才可使用。一段文字结论或旧 head 上的绿色检查不构成这种门禁。若无法确立这些保证，就继续等待有即时防护的合并。如果仓库要求走队列，就停在这个未满足的门禁上，不要绕过保护。

合并之后，确认状态为 `MERGED`、最终 head 已获批准、base 符合预期、合并提交非空。fetch 目标分支并运行 `git merge-base --is-ancestor "$merge_commit" "$destination_tip"`；推进之前先检查产出的内容。如果服务无法报告相关事实，结果就仍未确认。

服务参考：[GitHub CLI 合并旗标](https://cli.github.com/manual/gh_pr_merge)、[GraphQL pull requests 与 queue mutations](https://docs.github.com/en/graphql/reference/pulls)、[REST 合并端点](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request)。若实际能力与此不同，重新核查已安装服务的能力。在用完即弃的仓库中测试服务行为，绝不要拿生产 PR 做实验。
