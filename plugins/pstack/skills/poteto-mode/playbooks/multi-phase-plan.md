### 多阶段或多 PR 计划（Multi-phase or multi-PR plan）

通过 [poteto-mode 的 Non-negotiables](../SKILL.md#non-negotiables) 解析 driver skill。

**计划由你负责，代码不是。计划是一份清单，owner 逐项执行，操作员依据证据审核。** 计划就是交付物。不要动手实现。

1. 变更只有一两个文件且路数显而易见时，跳过计划。说明并停止。
2. 动笔之前先用原型解决开放问题。每个问题跑一次 `playbooks/prototype.md`。保留分支、SHA 和截图给附录 A。只有任何运行都定不下来的产品或偏好抉择才问操作员，并给出选项（**never-block-on-the-human** 原则 skill）。
3. 在 subagent 里探索，用 `subagent_type: "pstack:poteto-agent"` 并按 Subagents 章节显式指定模型（**guard-the-context-window** 原则 skill）。每个返回文件指针、约定、测试命令和入口点。不准内联倾倒。
4. 把下面的骨架复制进计划文件，填满每个占位符。操作员没有点名路径时，写到 agent store 下（`~/.claude/orchestrate/<slug>/docs/`）。所有标题、所有子块都保持所示顺序。每个 PR 一节。一个 PR 就是一个带自己证据的变更（**sequence-verifiable-units** 原则 skill）。在 **How to read this** 里点名执行 playbook。按 `playbooks/autopilot-stack.md` 末尾的规则在 `playbooks/autopilot-full.md` 与 `playbooks/autopilot-stack.md` 之间挑选。常设程序用 `playbooks/orchestrate.md`。base 选择、拓扑变更和合并权限归执行 playbook 管。不要把它的 rebase 步骤抄进计划。
5. 全文在 `/technical-writing` 下写作，然后 `/unslop`。正文只是一种 Diátaxis 模式：how-to。附录承载解释和参考。每个标题直陈任务或发现。不用长破折号。句中不用冒号。
6. 从已安装插件运行 `node skills/poteto-mode/scripts/check-plan.mjs <plan.md>`，修掉它打印的每一行（**encode-lessons-in-structure** 原则 skill）。
7. 交回。贴出计划路径和脚本输出，然后停止。执行在操作员显式 go 之后开始，按计划点名的执行 playbook 进行。

**验证。** 只跑测试不足以构成验证。一个 PR 只有 unit、live、perf 三个复选框全部勾选才算验证过（**prove-it-works** 原则 skill）。这句话就是验证规则，每个验证块都以它开头。live 块是强制的。在 PR head 上以配置的 `swarm workers` 模型跑十条 lane，通过 driver skill 驱动真实表面，按 **swarm** skill。每条 lane 是一个复选框，带具体场景、它保存的截图和通过谓词。其中一条是**对主干的回归 lane**：在主干和 head 上跑同样的承重场景。主干没有该功能时，这条 lane 记录该事实，改为把关 diff 新增的行为加上用户等待的最终状态，而不是编造一个主干结果。perf 门禁是双边的：主干和 head 都必须产出点名的指标。主干缺该功能时，还要把 diff 新增的工作单独隔离出来，为那份工作加上绝对预算，外加用户等待的端到端状态。不要拿不同质场景之间的比率说事。perf 块要点名指标、交错执行的探测、先测的主干基线，以及带数字的失败规则。改变交互的 PR 受审查门禁约束：合并前由操作员在聊天里看截图和视频审查。不改变交互的 PR 写 `**Review gate.** None. <PR id> is not review-gated.`，其下不放任何复选框。

**Driver skill。** 按 Non-negotiables 选定它，并把解析出的 skill 路径或确切命令写进每条 live lane 的 boot recipe。原生移动端用仓库里现成的模拟器驱动 skill。触及两个表面的 PR 两边都配 lane。没有 driver skill 的表面是附录 C 里的一条风险，其 live 块仍要写明每条 lane 如何驱动它。

````markdown
# <Program> plan

<Under ten lines. What changes, for whom, the rule the program enforces, and the PR ids in order.>

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `skills/poteto-mode/playbooks/<execution playbook>.md` from the installed plugin. <Who merges, and which PR ids are the operator's items that stop at merge-ready.>

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on the operator's explicit go.
- [ ] On the operator's go, write this exact text into the standing orders and restate it in your todolist. "<The plan path, the PR ids in order, the verification rule, who merges, and the done condition.>"
- [ ] Read these from the installed plugin at program start. Re-read them at every tick.
  - [ ] `skills/poteto-mode/playbooks/<execution playbook>.md`
  - [ ] `skills/swarm/SKILL.md`
  - [ ] `<driver skill path>`
  - [ ] `skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `skills/<each other leaf skill the program uses>/SKILL.md`
- [ ] Arm the hourly audit tick as a real `/loop` in dynamic mode, which schedules its own wake-up rather than blocking on a sleep. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from the installed plugin and the standing objective. Audit the operation against both and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then post a short status message to the operator in chat only when the audit found a tracked change that no earlier status message reported, such as a PR opened, a code-ready head, a round launched or closed, a verdict, a merge, a stuck agent and the action taken, a blocker added or cleared, or a decision only the operator can make. Name every such change and nothing else. Do not repeat a table, the merged list, or an unchanged blocker. If the audit found none, end the turn with no reply text. Either way, log this tick's row in your decision trail. The row names the items reported, or none."
- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the execution playbook names.
- [ ] Follow this dependency graph. Start dependent work only after its parent merges, or base it on the parent branch when the execution playbook stacks.
  - [ ] <PR id> and <PR id> are independent and first. Both branch from `main`.
  - [ ] <PR id> after <PR id>.
- [ ] Hold the file boundaries. <PR id or class> touches only `<glob>`.
- [ ] Hold the review gate. <PR ids> change an interaction. They wait for the operator's review in chat with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Resolve the forge once. Default to `gh`; if `command -v origin` succeeds and Origin can resolve the repository, use `origin pr` for every PR operation. Record any fallback to `gh`. Never require `gt`.
- [ ] Open the PR ready, never draft, per **Opening a PR**. Use the run's built-in PR tool when it has one, else `origin pr create --status open --base <base-branch>` or `gh pr create --base <base-branch>` according to the resolved forge. A stack child targets its parent branch.
- [ ] Run the repo's lint and typecheck once before the PR-facing push. Push with hooks on.
- [ ] Run `/deslop` before each commit and `/no-comments` before review.
- [ ] Triage every review-bot and security-reviewer comment per `../references/bugbot-triage.md`.
- [ ] Before the code-ready report and babysit, and again after merge prep, record the base and head SHAs prepared by the topology owner under the execution playbook.

### Verdict and merge, for every PR

- [ ] At the code-ready head SHA and at each later push that changes the patch, run the swarm per `skills/swarm/SKILL.md`. One gates lane. The ten live lanes from the PR's **Verify, live** block. The perf lane from its **Verify, perf** block. Two or more audit lanes, each with its own focus, that read the diff and the receipts and distrust the PR body. The root audits the receipts in the merge-ready report before the verdict.
- [ ] Clean only when every lane is `PASS`. Findings go back to the owner, including a defect that a lane filed as a note. A new head gets a fresh swarm and a fresh verdict, except for results that stay valid under the patch-id rule in `playbooks/shipping.md`.
- [ ] <The merge or append rule from the execution playbook, with the patch-id rule from `playbooks/shipping.md`.>

### Boot recipe, for every live lane

Each live lane runs in its own worktree at the PR head. Drive through the skill path or exact commands recorded in this boot recipe.

- [ ] `git fetch origin <head-branch> && git checkout <head SHA>`.
- [ ] <Start the backend and the surface. Wait for ready.>
- [ ] <Deliver input only through the driver skill's commands. Name the read-only diagnostics.>
- [ ] Save every screenshot to `/tmp/swarm-<pr-id>/worker-<n>/<slug>.png` and return the paths with the report.

## <Task as a verb phrase> (<PR id>)

**Depends on.** <PR id, or None.>

**Files.**

- [ ] Edit `<path>`.
- [ ] Create `<path>`.
- [ ] Delete `<path>`.

**Build.**

- [ ] <One change. Name the symbol and the file.>

**You see.**

- [ ] <One observable result, with the exact log line or screen state.>

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] <Test file and the case it gains.> Run `<command>`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on the configured `swarm workers` model at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Run <the same load-bearing scenario> at trunk and head. If trunk lacks the feature, record that and gate <the behavior the diff adds plus the end state the user waits for>. Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 2. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 3. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 4. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 5. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 6. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 7. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 8. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 9. <Scenario.> Save `<slug>.png`. Pass when <predicate>.
- [ ] Lane 10. <Scenario.> Save `<slug>.png`. Pass when <predicate>.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. <What is measured at both trunk and head. If trunk lacks the feature, also name the diff-added work and the end-to-end state the user waits for.>
- [ ] Probe. <The command or procedure, run at trunk and at the head, interleaved. Both sides must produce the metric.>
- [ ] Baseline. Record the trunk <value> first.
- [ ] Rule. <Head against trunk, with the number that fails. If the scenarios differ, add absolute budgets for the diff-added work and the user-visible end state instead of an invalid ratio.>

**Review gate.** The operator reviews before merge.

- [ ] Copy lane <n> screenshots into `<media path>/<pr-id>-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the change in a lane worktree. Save it as `<media path>/<pr-id>-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at merge-ready. Wait for the operator's click.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Base and verdict are current under the execution playbook and the patch-id rule in `playbooks/shipping.md`.
- [ ] <The owner squash-merges its own PR, or the root appends it to the base-branch stack and the operator lands it bottom-up.>

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

<Each open question a prototype answered, with the branch, the SHA, and the artifact links. Each question that stays unproven.>

## Appendix B. Alternatives rejected

<Each approach weighed and why it lost.>

## Appendix C. Risks

<Each risk with the PR it lands in and what the owner watches.>

## Appendix D. Links and reading list

<Docs to read before editing. Which PRs get `skills/how/SKILL.md` and `skills/interrogate/SKILL.md`. The trail per `skills/show-me-your-work/SKILL.md`.>
````

**回复：**计划路径、各 PR id 及其依赖和受审查门禁约束的集合、原型证明了什么以及什么仍未证明、检查脚本的输出。
