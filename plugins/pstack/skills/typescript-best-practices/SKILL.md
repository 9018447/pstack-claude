---
name: typescript-best-practices
description: TypeScript 最佳实践。在读取或编辑任何 .ts 或 .tsx 文件时使用。
paths: ["**/*.ts", "**/*.tsx"]
---

# TypeScript 最佳实践

先应用 **type-system-discipline** 这个 principle skill。

| 规则 | 要点 |
|------|---------|
| 可辨识联合（discriminated unions） | 用 `kind` 字面量判别字段为变体建模，让不可能的状态无法被表示。不要用一堆可选字段拼凑。 |
| 品牌类型（branded types） | 用 `& { readonly __brand: "X" }` 给原始类型打上品牌标记，使其不会被混用。在边界处校验一次。 |
| 构造式建模（constructive modeling） | 把类型构造成非法值根本无法被造出来的样子。非空用 `[T, ...T[]]`，偶数长度用 `[T, T][]`，区间用 `start` 加 `duration`。这不是运行时守卫，也不是对 refinement types 的空想。 |
| 最简单的全类型（total type） | 只要对 `T[]` 的每个操作都保持全（total），就继续用 `T[]`。只有当宽松类型在某个使用点逼出 `!`、一次 cast 或"永远不该发生"的 throw 时，才加强为 `NonEmpty<T>`。 |
| 用 `unknown` 而非 `any` | 外部数据一律是 `unknown`。 |
| 先 schema 后守卫 | 在手写逐属性的类型守卫之前，先使用仓库的运行时 schema 库，并从 schema 推导类型，例如 `z.infer`。 |
| 不用 `as` 断言 | 每个 `as` 都是一场等待发生的运行时崩溃。先校验，再转换。 |
| 类型收窄的优先级 | 判别字段 switch > `in` 运算符 > `typeof`/`instanceof` > 用户自定义类型守卫 > `as`。 |
| 类型守卫 | 必须真正验证其声明。说谎的守卫比 `as` 更糟，因为 bug 躲在一个声称安全的名字后面。用 `isX` 或 `hasX` 命名。 |
| 穷尽性 | 在 default 分支内联 `const _exhaustive: never = x;`，这样新增变体时编译器就会报错。 |
| 用 `satisfies` 而非 `as` | 在校验值的同时不拓宽字面量类型。 |
| 边界校验 | 在数据跨入之处解析为命名的领域类型。`Record<string, unknown>`（无论怎么拼写）到这次解析为止。内部信任类型。参见 **boundary-discipline** principle skill。 |
| 由 schema 派生类型 | 在声明新 interface 之前，先想到 `Pick`/`Omit`/`Parameters`/`ReturnType`/`Awaited`/`typeof`。 |
| 对象参数 | 传对象而不是按位置传参，让参数顺序不言自明。热路径（逐帧渲染、分词器、解析器）上跳过此规则。 |
| 真实测试 | 能跑的东西不要 mock。优先使用框架的真实测试原语并配泄漏 / disposable 检查，在运行中的构建里验证 UI。只 mock 本地跑不了的东西。 |
| 结构化遥测 | 优先使用结构化 logger 诊断，上下文要足以凭一个 id 完成调试。交付代码中不得出现 `console.log`。 |

示例见 `references/patterns.md`。
