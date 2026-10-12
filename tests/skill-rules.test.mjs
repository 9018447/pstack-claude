// Port-local rules live in files the port has forked, which tools/sync.mjs
// three-way merges: a clean merge is written, and a conflict is written with
// markers for a human to resolve. A rule dropped in either reads as a clean
// sync, so each one is pinned here by the sentence that carries it, with the
// issue or PR that earned it.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const skillsDir = fileURLToPath(new URL("../plugins/pstack/skills", import.meta.url));

const rules = [
  {
    source: "#71 callable driver policy",
    file: "poteto-mode/SKILL.md",
    phrase: "UI 一律用项目里的 `verify` skill",
  },
  {
    source: "#71 generated skill name",
    file: "create-verification-skill/SKILL.md",
    phrase: "YAML frontmatter（`name: verify`",
  },
  {
    source: "#71 preserve the original generator trigger",
    file: "create-verification-skill/SKILL.md",
    phrase: "make a control skill for this repo",
  },
  {
    source: "#71 maintain older generated skills",
    file: "maintain-verification-skill/SKILL.md",
    phrase: "或旧版生成器生成的 `.claude/skills/verify-*/`",
  },
  {
    source: "#72 task fallback keeps skipped steps",
    file: "poteto-mode/SKILL.md",
    phrase: "逐字抄入的 playbook 步骤，外加每一行 `skip: <reason>`",
  },
  {
    source: "#72 task fallback is a local checklist",
    file: "poteto-mode/SKILL.md",
    phrase: "不提交的 `todo.md` Markdown 清单",
  },
  {
    source: "#229 parallel sessions keep separate todolists",
    file: "poteto-mode/SKILL.md",
    phrase: "多个会话共用同一检出时，把它命名为 `.audit/<task-slug>.todo.md`",
  },
  {
    source: "#58 stop before you re-delegate",
    file: "poteto-mode/SKILL.md",
    phrase: "**先停掉被弃的 agent，并确认它停了。**",
  },
  {
    source: "#58 delegate isolation",
    file: "poteto-mode/playbooks/feature.md",
    phrase: "**给每个写文件的受托者配它自己的工作树**",
  },
  {
    source: "#228 delegate worktree starts from the branch",
    file: "poteto-mode/playbooks/feature.md",
    phrase: "用 `git worktree add <path> -b <delegate-branch> HEAD` 建它的工作树",
  },
  {
    source: "#59 item 1 drain the roster",
    file: "poteto-mode/playbooks/opening-a-pr.md",
    phrase: "停掉每一个持有它的，包括不是你启动的孙辈",
  },
  {
    source: "#59 item 2 verify the process",
    file: "principle-prove-it-works/SKILL.md",
    phrase: "结果要验证，过程也要验证。正确的结果可能建立在一个坏掉的过程上",
  },
  {
    source: "#59 item 3 red is a colour",
    file: "principle-prove-it-works/SKILL.md",
    phrase: "红色只是颜色，不是测量。失败的检查只有在失败内容正是你预判的那个不一致时",
  },
  {
    source: "#59 item 3 quote the failure content",
    file: "tdd/SKILL.md",
    phrase: "引用失败的内容，而不是断言那一行：抛出异常、对字面量得到空结果、预测的不匹配",
  },
  {
    source: "#59 item 4 search the places the rules name",
    file: "recall/SKILL.md",
    phrase: "漏掉项目规则点名位置的搜索不算穷尽。只有对没有点名目标的纯活动回顾",
  },
  {
    source: "#59 item 5 blast-radius before design",
    file: "blast-radius/SKILL.md",
    phrase: "对现有代码下了断言（\"make endpoint X public\"）时，要在设计之前运行本 skill",
  },
  {
    source: "#59 item 6 load the platform skill",
    file: "poteto-mode/SKILL.md",
    phrase: "先加载那个平台的 skill（项目本地的或已安装的）",
  },
  {
    source: "#59 item 7 severity picks the artifact",
    file: "poteto-mode/SKILL.md",
    phrase: "由严重度决定它记到哪个工件，而不是由发现位置决定",
  },
  {
    source: "#86 confirm the first status read",
    file: "poteto-mode/playbooks/babysit.md",
    phrase: "在按第一次状态读取行动之前，确认它报告的 PR 或栈与请求相符",
  },
  {
    source: "autopilot verify loop: only findings the diff causes go back",
    file: "poteto-mode/playbooks/autopilot-full.md",
    phrase: "只有当 diff 是成因时，发现才阻塞合并",
  },
  {
    source: "autopilot verify loop: bounded rounds",
    file: "poteto-mode/playbooks/autopilot-full.md",
    phrase: "每个 PR 至多两次 fix-forward",
  },
  {
    source: "autopilot verify loop: size stated before fan-out",
    file: "poteto-mode/playbooks/autopilot-full.md",
    phrase: "owner 超过三名的程序要等操作员对这个规模的 go",
  },
  {
    source: "#188 no self-review in place of an independent one",
    file: "poteto-mode/SKILL.md",
    phrase: "绝不要把自己的审查、通过的测试或 CI 当作独立判定",
  },
  {
    source: "#188 a missing reviewer blocks the gate",
    file: "poteto-mode/SKILL.md",
    phrase: "在待办清单里记录 `BLOCKED: independent review`",
  },
  {
    source: "#231 reflect digest carries no verdict",
    file: "reflect/SKILL.md",
    phrase: "它不下任何诊断、结论或归因。评判会话的是审查者",
  },
  {
    source: "#231 reflect adds nothing beside the transcript path",
    file: "reflect/SKILL.md",
    phrase: "除 transcript 路径外不要附加任何内容",
  },
];

describe("port-local skill rules", () => {
  test("every pinned phrase is distinctive enough to pin a rule", () => {
    const phrases = rules.map((r) => r.phrase);
    expect(new Set(phrases).size).toBe(phrases.length);
    for (const phrase of phrases) expect(phrase.length).toBeGreaterThanOrEqual(20);
  });

  for (const { source, file, phrase } of rules) {
    test(`${file} keeps the rule from ${source}`, () => {
      expect(readFileSync(join(skillsDir, file), "utf8")).toContain(phrase);
    });
  }
});
