### 编排（Orchestrate）

通过 [poteto-mode 的 Non-negotiables](../SKILL.md#non-negotiables) 解析 driver skill。

**程序由你负责，代码绝不是。撰写 brief、清空队列、保持前沿全绿、做决断。** 适用于把整个项目交给一个常驻协调会话：多天、多个堆叠 PR、几十到几百个 subagent，人类一天来看两次而不是每五分钟看一次。把一个任务驱动到一个谓词属于 Autonomous run。一次需要定制工作流的雄心运行属于 figure-it-out。工作寿命超过任何单个 agent 时路由到这里。一个 agent 在会话预算内能做完的工作不是程序。

仪式感必须随程序规模伸缩。在廉价且近乎相同的单元上，按各节的指示收缩。

三条规则撑起其余一切。

- 完成是队列事件，不是中断。
- 每次派生和每次 resume 都原样携带常设指令。
- brief 就是产品。模糊的 brief 会悄悄失败，因为 worker 没法向你提问。

#### 角色与布置

- **协调者（本会话）。** 定框、撰写 brief、清空收件箱、负责给人类的报告、做判断。绝不亲手写或改代码。撞到冲突的合并、restack、代码变更永远作为任务。机械落地一个已验证单元（对 worker 的提交做 fast-forward 或干净的 cherry-pick，然后 push）属于记账式操作，在本地 git 廉价的仓库上协调者可以自己做。把已完成的工作排在闲置的 stacker 后面，deadline 就会颗粒无收。整个循环端到端都是 agentic 的。agent 只通过 `Agent` 工具派生、resume 和清空。状态的读写在各清理点经 `orch` CLI 进行，一条命令进、一行结果出。CLI 绝不派生、等待或唤醒任何东西。
- **子协调者。** 持久的，每条轨道一个，且只在程序超出单个协调者清理能力时才设。协调者自己清得动的轨道不需要中间层。每层嵌套都要重新支付一整套定位开销；阻塞式子协调者还会在父级空转时把它的孩子藏起来。它拥有本轨道的单元和看板，撰写其 worker 的 brief，在运行时允许 subagent 再派生的地方派生自己的 worker 和 verifier。不允许的地方，它以同样的审查分离直接拥有本轨道的单元。在波次边界汇总聚合数据。绝不转发原始子报告。在途孩子封顶在一次清理能处理的量，大约十个，作为滚动窗口。绝不用阻塞批次——那会让每批都付出最慢孩子的代价。
- **Worker / verifier。** 后台 subagent（`run_in_background: true`）。Claude Code 没有远程 worker 环境，所以隔离就是每个写者一个工作树或分支，不是一台单独机器。运行时验证走 driver skill，brief 里写明其解析出的 skill 路径或确切命令。subagent 看不到本会话，所以它的 brief 要内联所需内容，或指向仓库和 store 路径。worker 宁少而宽。每个工作树或分支一个写者（principle-separate-before-serializing-shared-state）。单元的 verifier 跑在与 worker 不同的模型家族上。

深度停在协调者、轨道、worker 三层。轨道分解按项目撰写（构建、落地、验证是常见切法，不是规定形状）。硬编码的 swarm 树试过，因太僵硬而搁置。

#### Store 布局

创建 `~/.claude/orchestrate/<project-slug>/`，在仓库之外、会话之外。store 必须活得比本会话久：程序要跑几天，会话重启是预期内的（见"存活与失败"），而 store 就是复盘材料。会话草稿区再方便也不是候选。它是会话作用域且临时的，重启会把程序的唯一状态一并带走。每个文件有且只有一个写者。owner 发布事实，读取方在读时聚合。簿记使用已安装插件下的 `bun skills/poteto-mode/scripts/orch/orch.ts`（下文写作 `orch`），同时它的规范纯 TSV 与 JSON 在没有 CLI 时也保持可读。

- `preferences.md` 是常设指令登记表：编号行，每行一条约束（模型策略、栈形状和数量、验证门槛、禁区路径、上报策略）。人类裁定按[关于人类决定的断言](../../why/references/epistemics.md#关于人类裁定的论断)保留原始措辞与出处。agent 的解读和原文缺失要标注出来。复制不构成新决定。每次派生和每次 resume 都原样粘贴。指令会在多次 resume 之间衰减，每丢一条都要付一个人工回合。发现自己在复述某条指令时，先追加登记再行动（principle-encode-lessons-in-structure）。
- `overview.md` 是持久的 PR 和 issue 数据库。只追加。绝不因单个事件整体重写。
- `units.tsv` 每单元一行：id、轨道、状态、分支、PR、head SHA、brief 路径。就地更新行。
- `frontier.json` 是计算出的合并前沿，见"栈安全"。
- `ledger.tsv` 是验证台账，见"验证"。
- `inbox/` 存放完成指针。`gates.md` 搁置人工门禁（问题、选项、无回答时的默认值）。
- `decisions.tsv` 是经 show-me-your-work skill 的轨迹。
- `status.md` 在每次清理时从 `units.tsv` 和 `ledger.tsv` 派生，绝不手工维护。要从表里重新生成它，而不是把事件叙述进去。

#### brief

你发给 agent 的 prompt 是你唯一的产品，一份马虎的 brief 会在整棵树上复利成 slop。每次派生都携带全部字段。填不出的字段就是一个尚未划清范围的单元。

```
GOAL         one sentence, the outcome, executable by a stranger with no chat access
SCOPE        paths this unit may write; paths it may not; its exclusive worktree or branch
CONTEXT      pointers to files and PRs; upstream reports pasted in full when this unit
             depends on them, because workers cannot see siblings
ACCEPTANCE   checkable criteria, one per line
VERIFY       exact commands or the resolved driver skill path, plus known gotchas
TIMEBOX      rough cap on runtime; on expiry, return partial findings and stop rather than run on
FORBIDDEN    no gt, no rebase, no force-push, no fixes outside scope, plus unit-specific bans
REPORT       status, branch, head SHA, PRs, verdict, what you actually ran, deviations,
             suggested follow-ups
STANDING     <preferences.md pasted verbatim>
```

brief 按单元伸缩。一条命令就能完成的单元，把模板收成一段话，但仍要点名目标、范围、verify 命令和报告形状。给两行的修改裹 4KB 脚手架，写它和遵守它的成本都高过修改本身。派生时可以按 store 路径引用常设指令文件。原样粘贴保留给每次 resume，以及任何必须独立成立的 brief。

子协调者的 brief 另加：它的轨道边界与单元清单、派生预算、清理协议和汇总格式（每个孩子：名字、状态、PR、head SHA、判定、一句话，外加轨道状态与前沿变化）。

依赖是上下文中继，不只是排序。未声明的上游上下文让 worker 靠猜。字段缺失是拒绝派生的条件。每个波次对每个子协调者抽查一份 worker brief，与它抽样的波次并行进行，绝不作为挡在前面的关卡。brief 不合格就停掉那条轨道，并修正子协调者的指令，而不只是 worker，因为 brief 质量会在运行后期衰减。绝不把 brief 链式 resume。以整合后的范围重新派生。

#### 步骤

1. **定框。** 把完成谓词表述成可数的东西（"126 个单元全部合并，且每个都经台账验证为 `unit-test-verified` 或更高"）。量化范围：单元数、粗略工作量、预期栈数、墙钟预算。单个 agent 在该预算内就能做完的话，到此为止，改跑 Autonomous run。收缩绝不能依赖另一份文档在场：它意味着直接在本会话里干活，有益处的地方用普通 worker，验证内联，边做边落地，下面那套 store、登记表和试点机器一概不用。对照预算安排落地：大约用到 70% 时停止派生，把已验证的落地。按项目点名轨道。有争议的分解或单向门决策，试点之前先过 arena skill。定框只陈述一次。可逆的准备不等批准就推进。
2. **安装运行时。** 运行 `orch init`。经 show-me-your-work skill 开轨迹，任何派生之前先写常设指令，并用 `orch frontier set --repo <repo-dir>` 从现有 PR 播种 `frontier.json`。
3. **试点。** 把一个单元推过整条路径：brief、worker、验证、入栈、台账行、合并。试点存在的意义，是在代价只有一个 agent 而不是五十个时就证伪 brief 模板、verify 配方和单元粒度。任何扇出之前，先按试点证据修正契约。试点按单元伸缩：单元近乎相同且廉价的程序，第一个单元就是试点——作为普通单元运行、verify 命令内联，它一落地扇出就开始。专职试点流水线（独立 verifier agent、审计关卡）留给昂贵或新颖的单元形状，不留给克隆式单元——对后者，串行的试点没有东西可证伪。
4. **规模化。** 派生滚动窗口的 worker 直至在途上限，孩子完成即补位。阻塞批次要付每批最慢孩子的代价。只有超过"角色与布置"里的一次清理阈值才派生轨道子协调者。每次清理后重算就绪的工作。把上游报告中继进下游 brief。兄弟间的沟通只向上。抽查的 brief 审计与它抽样的波次并行跑，失败时叫停的是下一次补位，不是当前波次。
5. **清空。** 每个清理点都执行下面的队列纪律。
6. **落地。** 落地是连续的，绝不是最后一个阶段。集成从第一个已验证单元开始，与剩余波次并行。重仓库上，stacker 从第一波起就是常设角色，单元一验证就集成。本地 git 廉价的仓库上，协调者按"角色与布置"自己落地已验证单元。上层栈的工作之前保持前沿全绿。以"栈安全"为准。`frontier.json` 只在合并或收到新上报的 head SHA 时推进。
7. **收尾。** 清空最后的收件箱，把每个派生过的 agent 对账到一行终态（done、abandoned、zombie-reconciled），在真实产物上确认谓词，确认每个落地的 PR 对其当前 head SHA 都有判定，按 show-me-your-work 审计轨迹（含跨模型审查），把反复出现的修正沉淀进 `preferences.md` 或 brief 模板。store 原样保留。它就是复盘。

#### 队列与清空

- 收到完成通知，运行 `orch inbox push <agent> <unit> <status> [--report PATH]`，然后回到手头的事。绝不在原地深审。需要审查的完成事件变成一个 verifier 单元。绝不在清理内部审查 diff。
- 在四个时机分批清空：临界区结束、轨道汇总、前沿 watcher 唤醒（经 loop skill 布防，配长心跳兜底）、给人类报告之前。每批以 `orch inbox drain` 开头。清空期间新到的事件等下一批。
- 先做完的临界区：撰写 brief、栈操作、冲突决断、写门禁、更新台账或前沿。
- 每次清空给每个指针分类（landed、needs-verify、failed、zombie、noise），把结果行经 `orch unit add`、`orch unit set`、`orch ledger record` 写入，跑 `orch status`，然后在一条消息里派生下一波。
- 每条轨道的汇总要交代每个派生过的孩子：到了、重新派生过、或其范围被明确吸收。悄悄重做一个失踪孩子的工作，会同时掩盖浪费的开销和它的结果本要补上的覆盖缺口。
- 清空回合以 `orch status` 的三行收尾：对各状态的计数、变了什么、开着哪些门。细节在 `status.md`。完整的回复契约适用于检查点和收尾。

#### 栈安全

- 前沿是计算出来的对象，绝不是叙述。每次合并和每次栈变更之后都从 `gt` 重算 `frontier.json`，因为 restack 途中 GitHub 的 base ref 会漂移，而 gt 的跟踪才是权威：有序 PR 清单、分支名、head SHA、一个代数编号、最低的未合并 PR。在 gt 认识这条栈的地方解析它，通常是 stacker 的克隆。gt 元数据从未见过这些提交的检出会报告没有 PR 并且命令报错，而不是瞎猜。
- 每条栈恰好一个 stacker 可以跑 `gt`，在栈内串行。把持有者记进常设指令。这个规模的 restack 很慢，还会阻塞跑它的人，所以给它单独立一个单元，别让协调者掺和。
- Worker 绝不 rebase、绝不跑 `gt`。Babysitter 遵循 `playbooks/babysit.md`，每条栈一个，范围限于一个不可变的前沿代。它们把冲突报给 stacker，而不是自行 restack。
- PR 的关闭和改目标只走 stacker。关闭一个 base PR 会让其上每条链都变成孤儿。合并和栈手术也是带 brief 的单元，与其他无异。
- 一个 retro watcher 盯着已合并的 PR，留意回退、合并后 CI 崩坏和被落下的后续项。

#### 验证

验证按单元伸缩。VERIFY 只是一条廉价命令时，worker 自己跑并报告输出，协调者抽查凭证。专职 verifier agent（用与 worker 不同的模型家族）留给验证昂贵、吃判断或高影响面的单元。一个 verifier agent 的全部产品如果只是重跑一条命令，那是仪式，不是验证。

用 `orch ledger record` 写台账行。用 `orch ledger check` 查当前 PR 和 head SHA。`ledger.tsv` 每个判定一行，以 PR 号加 head SHA 为键：`live-ui-verified | unit-test-verified | type-check-only | verifier-blocked | verifier-failed`。CI 全绿是判定的输入，不是判定。行为层面的工作需要好于 `type-check-only`。`verifier-blocked` 不是通过，环境恢复后重新派生。`verifier-failed` 配一个修复单元，不是重新验证。worker 可以自报。verifier 在同一个键上覆盖它。新 head SHA 使该行作废，所以 restack 之后要重新验证。回答"这个验证过没有"的是台账，不是记忆，也不是 transcript。

单元的产出在落地那一刻就要外化，绝不攒到运行末尾，否则单元就不算完成。worker 推它的分支，verifier 写它的台账行，凭证落进 store。只存在于某台 VM 上的工作，VM 一死就等于从没做过。

#### 存活与失败

- 绝不为查看状态而 resume 一个 agent——resume 会重启一个闲置的 agent。只读探测：台账、`units.tsv`、`gh`、已推送的分支、后台任务列表。transcript 的 mtime 不是存活。
- 无声的死亡会在收件箱里得到一条合成的复盘行（单元、失败模式、最后的证据、可选动作）。证据到了就按证据重规划。绝不等待完全静默。
- 按模式重试：撞上限或 OOM，缩小范围重新派生。网络中断，原样重试。工具错误，换模型重试。未知，重试一次。两次重试之后，放弃该单元，围绕它重规划。
- 迟到几小时的僵尸回来，先对照当前前沿和台账对账，然后才接受任何东西。独特的发现经一个新单元抢救，绝不盲目合并。
- 当继续派生会在全树范围产出垃圾时（上游输出坏掉、验收失效、基础设施死亡），在常设指令顶部写一行停止线，让在途工作跑完，修好原因，再清除。
- 自己的基础设施重试也要像约束孩子一样封顶。连续几次工具中断后，停止重试。把终局交接写进持久状态（做完了什么、在哪、恢复用的确切命令），结束运行。
- 会话重启后，在途 subagent 已死。已推送的分支、打开的 PR 和 store 没死。重读常设指令和 `units.tsv`，重算前沿，按 PR 和分支（而不是 agent id）重新挂接在途工作，每条轨道从其存档 brief 加当前状态重新派生一个子协调者，清空，继续。死亡会话的 store 锁在下一次写入时自清。`orch` 会替换持有者 pid 已经消失的锁。

#### 上报

要到达人类的，按状态页分批而不是逐条：不可逆操作（对共享分支 force-push、部署、删除、关闭别人的 PR）、任何实验都定不下来的真正产品或偏好抉择、与观察到的事实相矛盾的常设指令、扛过一次重规划仍然存在的程序级死路。开口之前先把每条作为 `gates.md` 条目搁置，并绕开它安排工作。

绝不到达人类的：前沿微调、restack 机务、重试、CI 抖动分诊、审查线程分诊、格式修复、brief 已禁止的范围（拒绝并继续），以及"我还要继续吗"。拿不准时，行动并记录。

运行中发现的，只修挡住前沿的。其余停进后续事项。在这种扇出下，一点范围泄漏会放大成一堆没人要的 PR。

**回复：**检查点和收尾时：谓词以及 `units.tsv` 与 `ledger.tsv` 给出的对它的计数、各轨道及各自落了什么、前沿（PR 清单加 SHA）、判定摘要、放弃了什么及原因、等待人类的门禁（唯一的提问）、store 路径、轨迹路径。数字取自表，不是叙述。附上 PR 链接。
