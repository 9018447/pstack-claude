### 工作树与模拟器清理（Worktree and simulator cleanup）

**磁盘和安全闸由你负责。** 修剪已合并或已放弃的 git 工作树和过期的 iOS 模拟器来回收空间。删除不可逆，所以每一步都防着删掉正在使用或带着未提交工作的东西。

1. 快照并审计。记录 `df -h /`，然后运行已安装插件下的 `skills/poteto-mode/scripts/worktree-audit.mjs`（principle-build-the-lever）。它从 `git worktree list` 读路径，绝不手敲——手敲的 `myrepo-worktrees/x` 会漏掉住在 `.worktrees/myrepo/x` 的那个（principle-encode-lessons-in-structure）。它按大小、年龄、合并状态、未提交工作、PR 状态和最近触碰它的会话给每个工作树分类，然后建议一个桶。transcript 扫描很慢，放到后台跑。
2. 桶是建议，不是许可。被钉住的和活跃的会话才是真凭据（principle-prove-it-works）。从用户或你自己的会话列表拿到那个集合，对每个候选交叉核对。杠杆曾把一个用户钉住的工作树标成 `safe`，所以以钉住集合为准。
3. 删除之前核实使用情况。对每个 `verify-recent-chat` 行、或任何你存疑的对象，扇出 subagent 去读 transcript，报告该会话是否被钉住或仍在进行、以及它触及哪些工作树（principle-guard-the-context-window，transcript 是大宗数据）。被钉住的会话会通过后台 subagent 在相邻工作树里孵化 arena 和复现树，那些即使在会话列表里从不出现，也正在被使用。
4. 在不可逆损失前暂停。`wip:N` 是 N 个带未提交变更的被跟踪路径，`untracked:N` 是 N 个 git 从未见过的文件。两者都有的工作树两个都打印，如 `wip:1,untracked:5`。干净的工作树可以从它的分支恢复。任何一种未提交工作，目录一没就没了，所以要用审计计数时所用的调用列出它：`git -C <path> status --porcelain --untracked-files=all --ignore-submodules=none`，展示 `git -C <path> diff HEAD --ignore-submodules=none --submodule=log` 的 diff，先拿到决定再说。每一行 status 都是悬在工作上的东西，空 diff 绝不等于没有工作。diff 会漏掉所有未跟踪文件，普通 `git diff` 可能漏掉 submodule。点名 submodule 的 `wip` 行代表其中被改或新增的文件，或在那里做的提交。在 submodule 里跑同样的 status 调用来列出那些文件。`hold-locked` 表示树被另一个工具或 agent 锁着，原因在 LOCKED 列。`git worktree remove` 会拒绝加锁的树，所以不要绕过它去 `rm -rf`。按 Autonomy，干净、已合并且不在使用的放行；`wip`、`untracked`、加锁和在使用的暂停。
5. 修剪确认过的集合。每个路径 `git worktree remove --force <path>`。目录因被忽略的构建产物存活时，`rm -rf` 掉它，然后 `git worktree prune`。分支引用存活，工作树分支上的提交都保留。submodule 里做的提交与工作树一起存，也随它一起没。用 `df -h /` 确认并重新列表。
6. 模拟器和其他回收项。模拟器通常是次大的收益。`xcrun simctl --set testing delete all`（XCTestDevices 克隆）、`xcrun simctl delete unavailable`，以及 `xcrun simctl runtime list` 后对旧运行时 `runtime delete <id>`。需要更多时：Xcode 的 `DerivedData` 和 `iOS DeviceSupport`、编辑器的 application-support 缓存、`~/.claude/shell-snapshots/` 和旧的 `~/.claude/projects/` transcript（保留 **recall** skill 和 Session pickup 会读的近期那些）、包缓存（pnpm、uv、brew、yarn）。只清用户没说保留的缓存。

这是唯一一个在没有代码审查兜底的情况下删除用户状态的 playbook，所以上面的那些闸门就是审查。

**回复：**前后的 `df -h /` 及回收的空间、修剪掉的工作树、以及每个被扣下的一行原因（被哪个会话使用，或有未提交工作）。
