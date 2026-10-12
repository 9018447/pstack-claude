### 开启 PR（Opening a PR）

在其他每个 playbook 的结尾被调用。

**工作树。** 从 main 检出的 git 工作树里工作。subagent 继承它。同一分支上的多次 `Agent` 调用各拿自己的工作树，或者在两次调用之间执行 `git fetch && git reset --hard origin/<branch>`。分支上有不相干的脏改动：先 patch 出来，开新工作树，再应用。纠缠不清的工作树：从 main 重置，最小化重做。在从工作树提交、合并或部署之前，列出活跃 agent 并停掉每一个持有它的，包括不是你启动的孙辈。受托者的子级不继承它的 brief，所以一条只读指令到不了它们那里。逐一确认停止，然后跑 `git status`，读一读你即将交付的这棵树。

**提交。** 随时多提交。开 PR 之前整理成小而有序的提交。每个提交都是未来的一个 PR：可独立落地，顺序讲得清故事。修复属于刚做的那个提交就 amend；可以拆开就新提交。

**PR。** 提交前对 diff 跑 `/deslop`。审查前跑 `/no-comments`。每个 PR 标题、PR 描述和提交正文都用 `/technical-writing` 写，再过一遍 `/unslop`。技术写作的每一层都应用，Diátaxis 除外。一个动作用一个词，保留冠词，能用普通动词就不用 `-ing`。

**标题。** 用 Conventional Commits 的 `type(scope): subject` 形式。type 用 `feat`、`fix`、`docs`、`refactor`、`test`、`chore` 或 `perf`。scope 用变更所在区域，比如 `pstack` 或 `poteto-mode`。subject 保持短小、祈使语气。有承载变更的符号就点名它。例如 `fix(pstack): retarget opening-a-pr babysit trigger`。结尾不加句号。

**描述。** PR 正文是一份简报，不是实验记录。拿到 diff 的审查者应该在一分钟内明白：这个变更为什么存在、它刻意留下了什么、它可能破坏什么、你怎么证明它有效。写短的、简单的句子，少放标识符。不要写文字墙。squash 提交的正文就是 PR 正文。如果正文会让 squash 提交超过大约 40 行，砍正文。

每节放在 `##` 标题下，而不是加粗的引导词，让各节界限分明。按顺序使用以下章节。没什么可说的章节就删掉。

- `## Why` 用一到三句短话给出问题和思路。不列 SHA，不写 rebase 家谱，不加"基于 main"的前言。
- `## What changed` 一到三条短 bullet。只在符号或路径承载变更时才点名。重命名或改目标要写出两侧。
- `## Scope` 必须写明 PR 覆盖什么、刻意不覆盖什么，例如相关的后续项或已知缺口。一到三条短项。不列符号或路径，不写逐文件的散文。
- `## Tradeoffs` 只写那些不写出来审查者就会问起的被否决备选。没有真正的取舍就跳过这节。
- `## Blast Radius` 用一两句话说明变更触及谁或什么、为什么安全或危险。main 是红的，就写明让它继续红的代价。
- `## Verification` 一到三条 bullet。每条点名一次真实运行的路径及其结果。性能变更要报一个主数字带单位，用 `before → after` 形式。其余证据链到 arena 或 swarm 目录。不放样本量方法论、swarm 逐条复述或指标表。

这些章节之后，有能证明主张的视频或截图就附上。不要贴完整 SHA、swarm 或 arena lane 的复述、修正测量工具的长文、逐文件清单或"CLEAN"式的结论。这些细节放进一个链接的产物里。提交正文不复述自己的 subject。

**Forge。** 在第一个 PR 操作之前解析 forge，并为创建、编辑、查看、watch 和合并保持该选择。GitHub CLI（`gh`）是默认。如果 `command -v origin` 成功且 Origin 能解析出该仓库，优先 `origin pr ...`。Origin 缺席或解析不出仓库时，继续用 `gh` 并记录这一回退。不强求 Graphite（`gt`）。

**内置 PR 工具。** 运行提供内置 PR 工具时，创建、编辑、改目标、标记 ready 都通过它，绝不走 forge CLI。它自己的说明写了怎么用。用 CLI 开的 PR 会缺工具跟踪的东西，比如后续运行可以编辑的描述。工具覆盖不到的一切用解析出的 forge；运行没有这种工具时，所有 PR 操作也用它。

**规模与栈。** 宁要五个窄 PR，不要一个大 PR。栈是基础分支链。root PR 指向主干。每个子分支 rebase 到其父分支的确切末端，其 PR 指向父分支。没有内置 PR 工具时，按解析出的 forge 用 `origin pr create --status open --base <parent-branch>` 或 `gh pr create --base <parent-branch>` 创建子 PR，用 `origin pr edit <pr> --base <parent-branch>` 或 `gh pr edit <pr> --base <parent-branch>` 改已有子 PR 的目标。只有独立工作才直接从主干分出。做实质性栈工作之前先 rebase 到主干上。

**就绪。** 每个 PR 都以 ready 开启，绝不开 draft。内置 PR 工具可能默认 draft，所以通过它的每次创建调用都设 `draft: false`。Origin 传 `--status open`。`gh` 省略 `--draft`。PR 仍以 draft 开启时，通过 PR 工具标记 ready，或按解析出的 forge 运行 `origin pr ready <number>` 或 `gh pr ready <number>`。引用 PR 状态之前先跑 `origin pr view <number>` 或 `gh pr view <number>`。

**Babysit。** 开启 PR 不启动 babysit。贴出 URL，继续构建。先把阶段或整条栈建完。只有用户在整条栈存在之后开口要求，才单独跑一次 babysit，按 `babysit.md`。每个新 PR 都配一个 babysit 会拖住构建，并把检查花在后续波次会重启的提交上。反馈偏离意图时，要顶回去。

开 PR 的 subagent 跑 `interrogate`、`/deslop` 和 `/no-comments`，贴出 URL，然后不带 babysit 返回父级——除非它是 Autopilot-full 或 Autopilot-stack 的 owner。那种 owner 的 brief 给它指派 babysit 循环，它就是 `playbooks/babysit.md` 在等的那个请求。owner 在 code-ready 报告之后启动循环，并按其 playbook 上报 merge-ready 或 STACK-READY。这里和 `playbooks/babysit.md` 中"babysit 要等整条栈建好"的规则，对那种 owner 不适用。
