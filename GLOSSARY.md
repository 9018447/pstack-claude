# 术语表

本仓库把 pstack 插件内容译为简体中文时统一使用的术语定译。翻译或新增内容时从这里取词；发现译文与本表冲突，改译文或改本表，二者必居其一。

## 保留英文的词

以下词汇在中文技术语境中已成通用词，或作为本插件的概念名/标识符使用，一律不译：

- **产品与项目名**：pstack、poteto-mode、Claude Code、Codex、Copilot、Pi、GitHub、Lean、TLA+、skills.sh
- **插件机制词**：skill、agent、subagent、hook、prompt、playbook、harness、frontmatter、effort-agents
- **标识符**：skill 目录名与 frontmatter `name` 值、命令名（`/deslop`、`/bro` 等）、角色名（runner、worker、watcher、owner、verifier）、模型名、文件路径
- **逐字匹配串**：用户触发短语（如 "babysit this"、"show me your work"）、示例引文、模板占位符，翻译会破坏匹配，必须原样保留

## 译法表

| 英文 | 定译 |
| --- | --- |
| branch | 分支 |
| base branch | 基础分支 |
| trunk | 主干 |
| upstream | 上游 |
| commit | 提交 |
| merge queue | 合并队列 |
| rebase / force-push | 保留英文（与命令名直接相关） |
| worktree | 工作树 |
| context window | 上下文窗口 |
| review / code review | 审查 / 代码审查 |
| reviewer | 审查者（divergent / judgment / tooling reviewer → 发散型 / 判断型 / 工具型审查者） |
| synthesizer | 综合者 |
| rubric | 评分细则（首次出现括注英文） |
| effort level / reasoning effort | 推理力度（档位名 low/medium/high/xhigh/max 保留英文） |
| root cause | 根本原因 |
| investigation / evidence / hypothesis | 调查 / 证据 / 假设 |
| epistemics | 认知边界 |
| postmortem | 事后复盘 |
| incident | 事故 |
| idempotent | 幂等 |
| first principles | 第一性原理 |
| design space | 设计空间 |
| blast radius | 影响范围 |
| feature map | 功能映射 |
| benchmark | 基准测试 |
| prototype / refactoring / bug fix / eval | 原型 / 重构 / 缺陷修复 / 评估 |
| autopilot | 自动驾驶模式（首次出现括注英文） |
| hillclimb | 爬山式迭代（首次出现括注英文） |
| slop / AI slop | slop（首次出现可括注"AI 垃圾文风"） |
| checkpoint | 检查点 |
| resume | 恢复 |
| gate | 门禁 |
| transcript | 会话 transcript |

## 避免使用

- **拉取请求**：一律用 PR。
- **序列化**（shared state 语境）：统一用**串行化**，避免与数据序列化混淆。
- **回滚**（rollback 之外的场景）：描述撤销改动用**回退**（fix-forward → 前向修复）。
- **连载/序列** 等文学义：playbook 内的 stack（叠放的 PR 栈）译为**栈**，不译"堆叠系列"。

## 标题与锚点约定

- 原则类 skill 的标题译为 `中文译名（English Name）`，中文在前、括注原名。
- 描述式标题直接翻译；被跨文件锚点（`#models` 等）引用的标题保留英文，使锚点继续可用。
