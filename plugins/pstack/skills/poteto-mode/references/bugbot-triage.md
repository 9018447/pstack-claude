# Bugbot 分诊

当 Babysit playbook（`../playbooks/babysit.md`）处理 Bugbot 或审查自动化评论时，使用本参考。目标不是默认无视 Bugbot，而是不再把每条评论都当成必须执行的代码改动。

## 决策规则

行动之前，先给每条 Bugbot 线程分类：

- `fix`：评论指出了疑似的正确性、安全、隐私、数据丢失、认证、计费、迁移、幂等性、竞态或已上线行为问题。在最底层的归属 PR 中修复，然后回复提交 SHA 并解决该线程。
- `dismiss`：评论命中某个已记录的低风险噪音模式，且当前代码/上下文证明该担忧无需代码改动。回复简短理由并解决该线程。
- `ask`：评论是新颖的、高严重度的、涉及安全/隐私/数据、或含义不明。转而询问用户，不要猜。

拿不准就问。跳过一条吵闹的代码质量评论代价很小；跳过一个真实的数据或安全 bug 则不然。

## 已学习模式的格式

以后新增模式按此格式添加：

```markdown
### <short pattern name>

- Confidence: candidate | recurring | strong
- Skip when: <conditions that must be true>
- Do not skip when: <risk boundaries>
- Example signal: <phrases or code context that identify the pattern>
- Source: <PR/comment URL or short historical note>
```

只有一两个例子时用 `candidate`。多次真实驳回之后用 `recurring`。只有当模式足够窄、经反复验证且低风险时才用 `strong`。

## 反复出现的可跳过候选

### 有意为之的 UI 或设计系统视觉变更

- Confidence: candidate
- Skip when：PR 描述、截图、设计评审或附近代码已把视觉变更写明，而 Bugbot 评论只是在复述某个共享视觉默认值变了。
- Do not skip when：评论指向无障碍性、焦点可见性、键盘导航、颜色对比度、或 PR 并非有意更改的组件 API 契约。
- Example signal：关于焦点轮廓、按钮尺寸、间距或共享组件视觉默认值的评论，而负责人回复“intentional”或“intended”。

### Bugbot 看不到的上游或栈内使用

- Confidence: candidate
- Skip when：Bugbot 把某个导出、组件、辅助函数或文件标为未使用，而当前托管平台的 PR 列表与 diff、上游栈的 diff、或 PR 上下文显示栈里更靠后的 PR 正在使用它。
- Do not skip when：当前 PR 不属于任何栈、该符号是公共 API、或所谓上游使用无法验证。
- Example signal：“Exported component is never used”，配上“used upstack”之类的人工回复。

### 并行实现期间的临时重复

- Confidence: candidate
- Skip when：PR 有意少量复制代码，让新路径与一条正在删除、替换或验证中的旧路径保持平行。
- Do not skip when：被复制的代码涉及安全、计费、数据访问或 API 行为，或一个长期存在的共享抽象明显能降低风险。
- Example signal：“Significant duplication”或“duplicated validation logic”，而负责人解释旧路径将被删除、或重复逻辑是有意保持局部。

### 既有框架或组件不变量已覆盖该警告

- Confidence: candidate
- Skip when：该担忧已由当前 diff 或附近代码中可见的共享组件、框架契约、类型不变量或单一事实来源保证。
- Do not skip when：该不变量只是被假定而未被强制、依赖时序、或跨越数值可能分岔的异步/状态边界。
- Example signal：共享 popover 已强制视口边界，评论却说内层 popover 缺 max-height；或本检查值与传入值同源，评论却说可空值有问题。

### 负责人声明的后续跟进或推迟清理

- Confidence: candidate
- Skip when：PR 负责人明确说该问题是已知的后续跟进、当前 PR 没有使该行为变差、且评论不涉及高风险区域。
- Do not skip when：agent 在没有负责人意见的情况下行动、问题属于中/高严重度的产品行为、或推迟会让新的回退被合并进去。
- Example signal：“I'll worry about that later”或“we'll delete this eventually”。

### 已自行撤回或明确属于误报的规则评论

- Confidence: recurring
- Skip when：评论正文或 Bugbot 随后的回复明确说该发现已撤回、已合规或属于误报，且 agent 能在本地核实相关规则。
- Do not skip when：唯一证据是人类在高风险问题上说了一句“false positive”却无解释。
- Example signal：一条文件命名规则评论，其正文说该文件已经合规。

## 默认转问用户

以下类别不要自动跳过，即使之前有 PR 驳回过类似问题：

- 安全、隐私、认证、计费、数据保留、训练数据与权限边界方面的发现。
- 高严重度的发现。
- 迁移、schema、幂等性、并发与跨系统行为方面的发现。
- 建议的修复很小、且明显能降低风险而不改变产品意图的评论。

历史数据显示，人类有时会驳回安全/数据流评论。把它们当作负责人的个别判断，而不是团队范围的跳过规则。

## 近期 babysit 得出的候选经验

babysit 期间或之后，把看起来对团队有用但尚未成熟的候选经验追加到这里。一旦有几个 PR 证实了某个模式，优先把它从候选提升到上面一节。

### 手工重新实现浏览器原生行为

- Confidence: candidate
- Skip when：实际上从不。当 diff 用手工等价物替换浏览器原生行为（原生 sticky → JS 定位克隆、原生滚动定位 → 转发的 wheel/touch 事件、绘制顺序遮挡 → mask/clip-path）时，Bugbot 对这类代码的逻辑 bug 发现一贯成立。
- Do not skip when：发现涉及事件转发缺口（wheel deltaMode、触摸拖动、边缘滚动链、tap slop）、mask/clip 命中测试差异、或此类代码中 observer 与 React 状态的时序竞争。默认按 fix 处理。
- Example signal：“masks do not affect hit-testing”、“overlay blocks wheel scroll”、“ignores deltaMode”、“runs in the IntersectionObserver callback before React applies state”。
- Source：一个 sticky 遮挡 PR：六轮 Bugbot，约十八条发现，全部修复而非驳回。

### 契约测试漂移的说法验证起来很便宜，先跑测试

- Confidence: candidate
- Skip when：验证本身绝不跳过；它只花一条命令。当 PR 带有把协议或文档文字钉死的契约测试（对 SKILL.md 的正则、文档措辞快照），而 Bugbot 声称“测试与文档不再匹配”（或反之）时，先在 PR tip 上跑该测试再分类。红了一次就从经验上证实了该说法；绿了则是驳回回复里的具体反证。
- Do not skip when：不适用，这是验证捷径，不是驳回模式。注意“多轮通过就倾向驳回”的启发式在这里会失灵：钉住文字的测试之所以漂移，恰恰是因为更早的修复轮次改动了文字。
- Example signal：PR 的早期修复提交改写了被钉住的段落，随后出现“Contract test omits the pre-fix wait”这类说法；在 tip 上跑测试恰好挂在被引用的那条断言上。
- Source：一个钉文字的 PR 经历八轮 Bugbot；尽管此前每轮都已修复并解决，第 7 轮的说法仍然属实。

### 安全审查的过时发现，同一 PR 内稍后已修复

- Confidence: candidate
- Skip when：agentic 安全审查（或类似工具）声称缺少某个 authz/校验调用，而当前 PR tip 明确已包含该门禁（带测试），通常是在审查运行之后的后续加固提交中加上的。
- Do not skip when：被引用的辅助函数对所讨论的主体是空操作、该检查运行在它要防护的副作用之后、或对声称主体的覆盖缺失。
- Example signal：报了 HIGH 级“missing authorization check”，而 tip 上确切的防护调用已在副作用之前执行。
- Source：一个 webhook 端点 PR，其加固提交晚于审查运行。

### 放宽刻意收窄的错误条件会掩盖真实错误

- Confidence: candidate
- Skip when：发现要求把某个收窄的错误条件（特定 `errno`、错误码或状态类别）放宽成大杂烩，而这种窄恰恰编码了真实区别。典型形态是靠 `ENOENT` 门控的依赖兜底：“binary is not installed”和“the command ran and failed”是两种不同情况。对任何非零退出都重试，会让一个合理的失败（找不到、认证过期、网络）再去撞兜底，然后报告兜底的错误，把真错误藏起来。
- Do not skip when：窄条件漏掉了同类情形（另一个表示“二进制不可用”的 errno 如 `EACCES`、另一种传输层失败）、未处理路径会丢数据或留下半成品状态、或重试是幂等的且原始错误仍会浮出。
- Example signal：“only retries when X fails with ENOENT … never tries the fallback even when a working Y exists”，指向的代码里兜底是为依赖缺失而非操作失败设计的。
- Source：一个 CLI 改名 PR，其兜底是为缺失的二进制而非失败的命令而设。
