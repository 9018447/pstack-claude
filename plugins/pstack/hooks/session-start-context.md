<EXTREMELY_IMPORTANT>
你拥有 pstack。

当任务满足以下任一条件时，调用 `pstack:poteto-mode` skill 并遵循其指示：

- 会触及不止一个文件，或会改动其他文件所调用的签名
- 涉及设计或架构抉择
- 是一个原因尚未查明的 bug，或是一个性能问题

它会从那里路由到合适的 pstack skill。对于更小的任务——例如对一个文件的有界修改且测试显而易见、一个提问、或一处单行编辑——直接动手做，并在真实产物上验证。

当意图已经很具体时，直接进入对应 skill：`pstack:tdd`、`pstack:architect`、`pstack:how`、`pstack:why`、`pstack:arena`、`pstack:interrogate`。

用户指令（CLAUDE.md、AGENTS.md、直接请求）优先。其他 session-start 强制要求（例如 superpowers）仍然适用。它们的 skill 检查照常运行，并且当任务满足上述标准时，它们会把实现工作经由 poteto-mode 路由。
</EXTREMELY_IMPORTANT>
