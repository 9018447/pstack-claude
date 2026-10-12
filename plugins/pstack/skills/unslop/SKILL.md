---
name: unslop
description: 去除一切写作中的 AI 痕迹。必须始终应用。
---

# Unslop

编辑文本，去除 AI 模式化的写法。

## 流程

1. 按下文列出的模式扫描。
2. 重写。保留原意，贴合目标语气。

## 要检测并修正的模式

规则编号是稳定的 id，其他 skill 会引用。删掉一条规则就会留下空洞。

### 内容

3. **浮于表面的 -ing 短语。** "highlighting..."、"ensuring..."、"reflecting..."、"showcasing..."、"fostering..."。删除，或用真实来源展开。
5. **含糊的归因。** "Experts believe"、"Industry reports suggest"、"Some critics argue"。写明来源，否则删除。

### 语言

7. **AI 高频词汇。** Additionally、crucial、delve、enduring、enhance、fostering、garner、interplay、intricate、landscape（抽象用法）、pivotal、showcase、tapestry（抽象用法）、testament、underscore、vibrant。换成平实的词。
8. **"is" 的花哨说法。** "serves as"、"stands as"、"boasts"、"features"。直接说 "is" 或 "has"。
9. **"Not just X, but Y" 句式。** 直接陈述要点即可。
10. **强行凑三。** 把想法硬塞成三个一组。有几个用几个。
11. **同义词轮换。** 同一段落里 Protagonist、main character、central figure、hero 换着用。选一个，重复使用。
12. **虚假的范围。** "from X to Y"，但 X 和 Y 并不在同一个有意义的尺度上。直接列出各个主题。

### 文风

13. **滥用破折号。** 完全不用破折号。只用句号或逗号（不用括号、不用 en dash、不用连字符充当破折号）。如果一个意思需要分隔，就用句号断句，或用逗号。
14. **滥用冒号。** 冒号放在列表或示例前没问题，但不能当句中连接词。"If you're coming from traditional automation: instead of registering event handlers, you describe conditions" 里的冒号毫无增益。改写成让要点独立成立、不靠对比框架的形式："Describing when the scheduler should fire works best as plain English." 意思不变，去掉那根拐杖式标点。
15. **滥用加粗。** 不要给每个专有名词或缩写都加粗。
16. **行内标题式列表。** 典型特征是用加粗标签加冒号复述本行内容："**Performance:** Performance improved..."。把这类写法改成散文。加粗引导句如果以句号结尾、点明了条目、后面跟着真正的新信息（"**Schema in TypeScript.** Tables live in one file."），就没问题，不是 AI 腔。
17. **标题用 Title Case。** 改用句首大写。
18. **装饰性表情符号。** 从标题和列表项中移除。
19. **弯引号。** 换成直引号。

### 聊天腔

20. **聊天机器人式客套话。** "I hope this helps!"、"Let me know if..."、"Of course!"、"Certainly!"、"Found the smoking gun!"。删除。
22. **谄媚语气。** "Great question! You're absolutely right!"。直接回应问题本身。

### 填充语

23. **填充短语。** "In order to" 改成 "To"。"Due to the fact that" 改成 "Because"。"It is important to note that" 直接删掉。
24. **过度模糊限定。** "could potentially possibly be argued that it might" 改成 "may"。
25. **空泛的结论。** "The future looks bright."。写出具体的计划或事实。

### 行话

26. **抽象隐喻名词。** Substrate、wedge、vector、locus、vantage、nexus、primitive（作名词）、harness（作隐喻）、surface（如 "API surface"）、bedrock、scaffolding（作隐喻）、modality、paradigm、gold-plating、ratchet（作隐喻）、evacuate（指迁移代码时）、endgame、north star、flywheel。这些词看似专业，但几乎总有更平实的具体说法。"Substrate" 改成 "base"。"Wedge in" 改成 "add"。"Vector" 改成 "way" 或 "method"。"Gold-plating" 改成 "more than the job needs"。"Ratchet" 改成该机制的实际名称，或 "a limit that only tightens"。"Evacuate" 改成 "move out"。"Endgame" 改成 "the last phase"。选那个具体的词。

### 平实表达

27. **写它做什么，而不是它感觉如何。** "the database stays close at hand"、"SQL you can read"、"types that follow your schema" 都只是在描述一种感觉。改法是写出机制或数字："`.toSQL()` returns the exact string sent to the database"、"a column rename fails the build"。先问这句话想让读者做什么或知道什么，然后写那个。如果无法把它重述为一条具体的指令、事实或数字，就删掉。再查一点：如果这句话原封不动放进另一个项目的文档也成立，那它对这个项目毫无信息量。删掉。
28. **压缩或拆开信息密度过高的句子。** 如果读者需要回读才能解析一句话，就把它拆成两句，或删掉从句。每句话只说一件事。
29. **主动语态。** 优先使用。抓住 "is/are/was/were + 过去分词" 并点名施动者："queries are validated" 改成 "the compiler validates queries"，"the file is parsed by the loader" 改成 "the loader parses the file"。只有施动者未知或确实无关紧要时，被动语态才可接受。
30. **删掉副词，或换更强的动词。** "runs quickly" 改成 "is fast" 或直接给出数字。"significantly improves" 改成实测的差值。靠副词撑着的弱动词，说明动词选错了。
31. **优先用平实的词。** "utilize" 改成 "use"，"leverage" 改成 "use"，"facilitate" 改成 "help"，"numerous" 改成 "many"，"in the event that" 改成 "if"。花哨的同义词很少更清楚。
32. **做作的文风。** 在有直白说法的地方用隐喻或修辞：格言式警句（"wire it or delete it"）、为效果而设的残句、拟人化的代码（"the plan holds it"）、比喻性动词（"rides along"、"stands on"）、套路化的框架短语。"A dial worth turning" 改成 "a parameter worth varying"。想说什么就说什么。隐喻名词见规则 26。
33. **过度压缩。** 丢掉冠词、没有动词的残句、符号化的表达，以及逼读者去解码而不是阅读的缩写。"Parser rejects bad date → exit 2, no write" 应写成 "The parser rejects a bad date, exits with code 2, and writes nothing."。写出带冠词和动词的完整句子，把箭头和缩写都展开。
