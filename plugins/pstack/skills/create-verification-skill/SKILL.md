---
name: create-verification-skill
description: "生成一个项目本地的验证 skill，让它像用户一样驱动你的应用——不限语言、框架或平台。用于 /create-verification-skill、\"make a control skill for this repo\"、\"make a driver skill for this repo\"，或当项目缺少脚本化手段来证明 UI/CLI/服务行为之时。"
---

# 创建验证 skill

在 Codex 上，遵循本 skill 之前，先阅读[平台映射](../poteto-mode/references/codex-tools.md)，包括其中针对各 skill 的注意事项。

在 GitHub Copilot 上，遵循本 skill 之前，先阅读[平台映射](../poteto-mode/references/copilot-tools.md)，包括其中针对各 skill 的注意事项。

任何严肃的项目都需要一种脚本化的方式来驱动真实应用并证明行为：启动它、像用户那样使用某个功能、并采集证据。本 skill 会把它生成为一个针对该仓库定制的项目本地 skill（`.claude/skills/verify/`）。命名为 `verify`。放在仓库根目录时，这个同名的项目 skill 会取代 Claude Code 内置的 `/verify`（后者只有用户能调用），于是每个指名驱动 skill 的 playbook 都能调用项目里的这一个（[Claude Code 2.1.200 或更高版本](https://code.claude.com/docs/en/skills#run-and-verify-your-app)）。在 monorepo 中，则改为写在被改动的 package 目录里。你写的生成结果是为下一个 agent 准备的，不是为人准备的：它会在任务进行到一半时，被一个从未见过这个应用的 agent 从零读起。

## 1. 访谈仓库，而不是用户

以下问题从代码库中找答案，只有无法观察到的才去问用户：

- **界面：** 用户实际接触的是什么？Web UI、CLI/TUI、桌面应用、API、移动应用，还是库？一个仓库可以有多种；选定主要的一种，并记下其余的。
- **运行：** 应用如何在本地启动？优先使用仓库自己文档化的开发命令（package scripts、Makefile、README 快速上手）。记录端口、环境变量、种子数据、认证。
- **驱动：** agent 如何以编程方式与它交互？优先用现成的 harness——Playwright/Cypress spec、expect 脚本、PTY 辅助脚本、能直接用 curl 调用的端点、调试端口。实在没有，才选一个通用方案：Web 和 Electron 用浏览器 / CDP，CLI/TUI 用 tmux/PTY harness，服务用纯 HTTP。
- **观察：** 能采集什么证据？截图、终端记录、响应体、日志、退出码、数据库状态。
- **隔离：** 两个实例能否并排运行（端口、数据目录、profile）？如果不能，在生成的 skill 里写明：拒绝双重驱动共享实例，好过弄坏用户的会话。

如果当前 checkout 原样无法构建或启动，先修复（或精确报告问题）再生成；基于坏掉的基础写出的 skill 教的是错误步骤。当某个无关的缺失资源阻碍启动时（API 从不服务的静态目录、一份示例配置），生成的 skill 可以创建它，明确标注为验证脚手架，并在清理时移除。

## 2. 生成 skill

写入 `.claude/skills/verify/SKILL.md`，包含 YAML frontmatter（`name: verify`，以及一个 `description`，写明应用名称、界面和何时使用——没有 frontmatter，skill 永远不会注册；而带上 `disable-model-invocation`，模型就无法调用它），以及以下各节，每一节都要以访谈的真实发现为依据（不留占位符）：

- **启动：** 为验证而启动应用的确切命令，以及如何判断它已就绪（一条日志行、一个端口开始应答、一个提示符）。包含拆除。对于短命的 CLI 或 TUI，没有需要保活的服务端：启动意味着先构建一次二进制（或安装依赖），然后在各自隔离的 PTY 或 tmux 会话中开始每一次驱动。
- **自检：** 一次只读检查，回答"这个实例值得驱动吗？"——进程在运行、版本 / 构建正确、端口归我们所有、认证有效。每当有地方看起来不对劲，agent 都先运行它。
- **驱动：** 带着本仓库真实选择器 / 命令的 harness 配方，而不是示例。优先使用稳定句柄（ARIA 标签、data 属性、提示字符串、路由路径），而不是坐标和 Tab 顺序。
- **证据：** 为证明要采集什么、存到哪里。写明证明标准：走真实的用户路径，而不是内部 setter 或仅供测试的端点；同时采集操作和操作后的状态，而不只是最终画面；在可见内容之外一并验证副作用（写入的文件、插入的行、发出的消息）；只在生产边界已经隔离外部系统的地方使用 mock。当安全路径是 dry-run 或测试模式时，通过观察（文件、网络、git 引用）来验证它实际跳过了什么，而不是轻信它的名字：有些 dry-run 仍会碰网络或打开浏览器。
- **清理：** 如何拆除本次运行创建的实例。绝不按进程名杀进程；只杀自己启动的。清理移除的是实例和临时状态，绝不是证据：证明产物要在拆除后幸存，存放在 skill 指定的位置。
- **辅助脚本：** skill 随附的任何脚本都必须可执行，且其调用方式写在 skill 正文里。需要读者逆向猜测用法的辅助脚本不配叫辅助脚本。

## 3. 建立功能映射

创建 `.claude/skills/verify/features/README.md`，外加每个你能识别的用户可见功能一个文件（起步先抓最重要的 3-5 个，来源可以是路由、命令、菜单或文档）。遵循 [`references/feature-map-example/`](references/feature-map-example/) 的形态：一个 README 索引，每个功能一个文件。每个文件都从用户视角回答：这个功能是什么、如何到达它、如何用 harness 驱动它、以及什么可观察的最终状态能证明它正常工作。四个 H2 小节分别是 `Sub-features`、`How to get to it (user POV)`、`Driving it with <harness>` 和 `Gotchas`。这份映射是仓库持续维护的验证之源；当映射还列着其他入口时，只驱动一个顺手入口的证明是不完整的。

## 4. 交付前先证明生成的 skill 可用

把 skill 自己的指令从头到尾完整执行一遍：启动、自检、驱动一个已映射的功能（一个就够；映射的存在正是为了让后续运行覆盖其余的）、采集证据、清理。清理之后，确认证据仍然存在于指定位置——会把证明吃掉的清理意味着本步骤失败。哪里失败就修哪里，并且每次失败的迭代之后也要运行生成的清理，免得失败的尝试留下无人处理的进程和被占用的端口。从未执行过的生成 skill 只是草稿，不是交付物。

## 5. 提供维护循环

告诉用户可以用 `/maintain-verification-skill` 在应用变化时保持映射不失真。除非用户问起，否则不要主动建议更新频率。
