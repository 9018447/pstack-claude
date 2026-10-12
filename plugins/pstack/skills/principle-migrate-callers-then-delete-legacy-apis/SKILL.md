---
name: principle-migrate-callers-then-delete-legacy-apis
description: "在旧调用方仍存在时引入新的内部 API 时应用。在同一波重构里迁移调用方并删除旧 API，而不是保留兼容层。"
user-invocable: false
---

# 先迁移调用方再删除遗留 API（Migrate Callers Then Delete Legacy APIs）

当我们认定新 API 才是正确设计时，就在同一波重构里迁移调用方并删除旧 API，而不是保留兼容层。

**规则：**
- 不要仅因为内部调用方还存在就保留遗留 API 路径
- 清点调用方，迁移它们，立即删除旧 API
- 把临时适配器当作例外且限时存在的东西，而不是默认架构
- 更新测试以断言新契约，删除只保护重构前实现细节的测试

**适用条件：**
- 没有外部用户依赖向后兼容
- 项目能够消化协调一致的破坏性变更
- 新 API 是简化或重构行动的一部分

新旧 API 并存会制造双路径复杂度、拖慢清理，并让代码库感觉只能追加、无法删减。
