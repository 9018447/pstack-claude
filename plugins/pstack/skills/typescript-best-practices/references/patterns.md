# TypeScript 模式

`SKILL.md` 中每条规则的代码示例。这些底层原则与具体语言无关。参见 **type-system-discipline** 与 **boundary-discipline** 这两个 principle skill。

## 品牌类型

给原始类型打上品牌标记，使它们不会被混用。在边界处校验一次。下游代码信任这个类型。

```ts
type AgentId = string & { readonly __brand: "AgentId" };

function parseAgentId(input: string): AgentId {
  if (!isUUID(input)) throw new Error(`Invalid agent id: ${input}`);
  return input as AgentId;
}

function focusAgent(id: AgentId): void {
  /* input is trusted */
}
```

与 `readonly __brand: 'X'` 的形状保持一致。不要另发明约定。

## 可辨识联合

用字面量判别字段为变体建模。所有变体共享同一个字段名，且每个变体的取值各不相同，因此不可能的组合无法被表示。

```ts
// Don't. Boolean + optionals lets contradictory states exist.
type DiffState = { loading: boolean; diff?: GitDiff; error?: string };

// Do. Only valid states exist.
type DiffState =
  | { kind: "loading" }
  | { kind: "ready"; diff: GitDiff }
  | { kind: "error"; error: string };
```

选定一个判别字段名（`kind`、`type`、`tag`）并坚持用它。

## 构造式建模

用全都合法的部件直接构造出类型，而不是靠运行时检查去约束一个宽松类型。

非空，用可变长元组表示：

```ts
type NonEmpty<T> = [T, ...T[]];

// Don't: T[] plus a length check every caller must repeat
function pickWinner(entries: string[]): string {
  if (entries.length === 0) throw new Error("no entries");
  return entries[Math.floor(Math.random() * entries.length)];
}

// Do: an empty value of the type can't exist
function pickWinner(entries: NonEmpty<string>): string {
  return entries[Math.floor(Math.random() * entries.length)];
}
```

当拿到的只是普通 `T[]` 时，用守卫收窄一次。这个事实随后就会随类型一起传递：

```ts
const isNonEmpty = <T>(arr: T[]): arr is NonEmpty<T> => arr.length > 0;
```

偶数长度，用成对（pairs）表示：

```ts
type Pairs<T> = [T, T][];
```

时间区间，用 start 加时长表示：

```ts
// Don't: a comment holds the invariant
type TimeRange = { start: Date; end: Date }; // start <= end

// Do: a negative range can't be written; derive end when needed
type TimeRange = { start: Date; durationMs: number };
```

让 `durationMs` 保持为普通 number。只有当裸 number 可能被传到期望时长的地方时才打品牌（按"品牌类型"一节的做法），不要条件反射地打。先选定一种让坏状态无法构造出来的表示，再在其上暴露你需要的读取方式（`pairs.flat()`、`rangeEnd()` helper）。

## 最简单的全类型

不要什么都加强。只要对 `T[]` 的每个操作都是全（total）的，就保留 `T[]`：

```ts
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0); // [] is 0, fine
```

只有当宽松类型在某个使用点逼你说谎时才加强。迹象是 `!`、`arr[0] as T`，以及"永远不该发生"的 throw：

```ts
// Don't: partiality smuggled past the compiler
function newestSession(sessions: Session[]): Session {
  return sessions.at(0)!;
}

// Do: strengthen the input; the assertion disappears
function newestSession(sessions: NonEmpty<Session>): Session {
  return sessions[0];
}
```

把结果弱化为 `Session | undefined` 是另一种保持全（total）的签名。

## 用 `unknown` 而非 `any`

外部数据一律是 `unknown`。使用前先收窄。

```ts
// Don't
function handle(input: any) {
  return input.foo.bar;
}

// Do
function handle(input: unknown) {
  if (typeof input === "object" && input !== null && "foo" in input) {
    // narrowed; compiler verifies access
  }
}
```

外部来源包括 RPC 载荷、`JSON.parse`、`postMessage`、IPC、文件内容、环境变量、数据库结果。

## 先 schema 后手写守卫

在为外部数据手写逐属性的类型守卫之前，先找找仓库的运行时 schema 库和既有 schema。让一个 schema 独自负责校验，并从它派生 TypeScript 类型。不要同时维护一个 schema、一个重复的 interface 和一个守卫——它们会各自漂移。

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["admin", "member"]),
});

type User = z.infer<typeof UserSchema>;

function parseUser(input: unknown): User {
  return UserSchema.parse(input);
}
```

当失败是预期分支之一时使用 `safeParse`。如果仓库用的是别的 schema 库，就用它等价的类型推导 helper。不要为了一条守卫就新增一个 schema 依赖。本规则偏向代码库已经信任的那套 schema 体系。

## 不用 `as` 断言

每个 `as` 都是一次潜在的运行时崩溃。只有类型系统验证过该声明之后才做转换。

```ts
import { z } from "zod";

// Don't
const user = data as User;

// Don't
function isUser(data: unknown): data is User {
  return typeof data === "object" && data !== null && "id" in data;
}

// Do
const userSchema = z.object({ id: z.string(), name: z.string() });
type User = z.infer<typeof userSchema>;

function parseUser(data: unknown): User {
  return userSchema.parse(data);
}
```

当类型在前时，用该类型去标注校验器，标明它能证明什么。这样编译器会拒绝证明了比该类型更少的校验器。把下面这个对象中的 `name` 删掉，赋值语句就会编译失败。

```ts
type User = { id: string; name: string };

const userSchema: z.ZodType<User> = z.object({ id: z.string(), name: z.string() });
```

从既有代码中重构掉 `as` 时，先弄清 TypeScript 为什么推不出来：

- 缺少判别字段：加一个，改用可辨识联合。
- 源类型过宽（例如 `Record<string, unknown>`）：收窄它。
- 无类型边界：用拥有该形状的 schema 解析。只在确实没有 schema 的地方新增 schema。
- 确实无法表达：改用品牌类型或 `satisfies`。

## 类型收窄的优先级

按从最优到最后手段排序：

1. **可辨识联合的 switch / if。** 编译器自动收窄。
2. **`in` 运算符。** `"key" in obj` 会收窄到含有该键的变体。
3. **`typeof` / `instanceof`。** 用于原始值与类实例。
4. **用户自定义类型守卫。** 当以上都不够用时。
5. **`as` 断言。** 只在校验之后使用。

```ts
function area(s: Shape): number {
  if ("radius" in s) return Math.PI * s.radius ** 2; // narrowed to circle
  return s.width * s.height; // narrowed to rect
}
```

## 类型守卫

守卫必须真正验证它所声称的事情。说谎的守卫比 `as` 更糟。

```ts
function isCircle(s: Shape): s is Shape & { kind: "circle" } {
  return s.kind === "circle";
}
```

可能的话，优先使用判别字段收窄。

## 穷尽性

在 default 分支里，把判别值赋给一个 `never` 类型的局部变量。

```ts
// Value-returning switch
function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.radius ** 2;
    case "rect":
      return s.width * s.height;
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}

// Void switch
function handle(s: Shape): void {
  switch (s.kind) {
    case "circle":
      drawCircle(s);
      break;
    case "rect":
      drawRect(s);
      break;
    default: {
      const _exhaustive: never = s;
      void _exhaustive;
    }
  }
}
```

有返回值的 switch 用 return 风格，作语句用的 switch 用 void 风格。

## 用 `satisfies` 而非 `as`

`satisfies` 能校验值，同时不拓宽字面量类型。

```ts
// Don't. Widens, loses literal types.
const config = { theme: "dark", cols: 3 } as Config;

// Do. Validates AND preserves literal types.
const config = { theme: "dark", cols: 3 } satisfies Config;
// config.theme is "dark" (literal), not string
```

## 边界校验

在数据跨入之处校验一次。内部信任类型。参见 **boundary-discipline** principle skill。

- **线上格式（wire format）**（proto、JSON-RPC）：解析时带上 `ignoreUnknownFields`，让前向兼容的变更不会破坏旧客户端。
- **持久化的 JSON：** 带版本的 blob，在解析外面包一层 try/catch。
- **不要**在调用链深处重复校验。

## 由 schema 派生的类型

当 `.proto`、OpenAPI 规范、GraphQL schema 或数据库迁移已经定义了形状时，从生成的类型派生，而不是复制一份。

```ts
// Don't. Duplicate shape, drifts when the schema changes.
type CheckSummary = {
  totalCount: number;
  checks: { name: string; status: string }[];
};
function renderChecks(s: CheckSummary) {
  /* ... */
}

// Do. Derive from the generated schema type.
import type { ChecksMessage } from "<generated module>";
function renderChecks(s: Pick<ChecksMessage, "totalCount" | "checks">) {
  /* ... */
}
```

在写新 interface 之前，先用 `Pick`、`Omit`、`Parameters`、`ReturnType`、`Awaited`、`typeof`。

## 对象参数

```ts
// Don't. Swap two args, still compiles.
openFile(uri, {
  startLineNumber: 10,
  startColumn: 1,
  endLineNumber: 10,
  endColumn: 1,
});

// Do. Order-independent, self-documenting.
openFile({
  uri,
  selection: {
    startLineNumber: 10,
    startColumn: 1,
    endLineNumber: 10,
    endColumn: 1,
  },
});
```

热路径上跳过这一规则：逐帧渲染、分词器、解析器，以及任何运行在紧凑循环里、分配开销举足轻重的代码。
