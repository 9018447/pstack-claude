### 编写或修改 skill

**skill 的笔调由你负责。**

1. 使用 **plugin-dev:skill-development** skill（Claude Code 的 SKILL.md 编写指南）。
2. 校验该 skill：frontmatter 含 `name` 和 `description`，引用的文件存在，跨 skill 链接可达。
3. 涉及结构就写测试用例；主观内容则跳过。
4. 运行 **Opening a PR**。

拿不准就删。只留下能改变决策的文字。让它去做那件事，省掉理由。只有在缺了理由规则会让人困惑时才解释。笔调匹配范围。按 **encode-lessons-in-structure** 原则 skill，指向结构性源头（类型、README、配置）。按路径委托给其他 skill。不要复述。你反复撞见却未被沉淀的工作流 → 提议一个新 skill。

**回复：**skill 的摘要、关键设计决策、校验说明。
