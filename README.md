# Claude Team Kit

A drop-in kit that turns Claude Code into a small product team for any project. The main Claude session acts as **PM** (project manager) and runs two teams:

- **Development team:** 17 specialist agents (frontend, backend, QA, security, accessibility, Figma intake, and more) that build and verify code.
- **Design studio:** 17 UI/UX agents led by a design director that research, design, audit and test products in Figma, with explicit rules against generic, AI-looking output. They start only when you say so and run up to 12 at once.

The kit also includes spec templates, design-studio docs, Figma helpers, test scripts, and token-usage reporting.

---

## What this project does

| Area | What it gives you |
|---|---|
| **Team structure** | The main session is the PM. It follows `PM-PLAYBOOK.md`, turns your brief into acceptance criteria, and delegates to specialists. |
| **17 specialist agents** | Role definitions in `.claude/agents/`. Each has its own scope, tool limits, and model (`opus` for review and architecture work, `sonnet` for implementation). |
| **Engineering standards** | Shared rules for quality, evidence, and status labels (`IMPLEMENTED` / `VERIFIED COMPLETE` / `BLOCKED`). |
| **Risk-based gates** | Low, Normal, and High tiers decide which reviews and tests a task needs, so a small docs edit doesn't pull in all 17 agents. |
| **Spec workflow** | Templates for requirements, design, tasks, slice briefs, and QA reports. |
| **Session memory** | A `SessionStart` hook loads `.claude/team/STATE.md` into every new session, so work continues where it left off. |
| **Design to code** | Figma REST helper and pixel-diff tool for comparing the running app against Figma renders. |
| **Testing** | Playwright route smoke test and keyboard/axe accessibility checks. |
| **Reporting** | Token usage by model, area, and agent, plus a final report template. |
| **Safety** | Scoped permissions; force-push, `git reset --hard`, `git clean` and similar commands are denied. The team never pushes or deploys on its own. |

## The development team

| Agent | Model | Responsibility |
|---|---|---|
| `figma-analyst` | sonnet | Pulls approved Figma frames, tokens, and assets into a traceable design handoff |
| `creative-director` | opus | Art direction and motion specs; reviews the built result visually |
| `frontend-dev` | sonnet | UI, accessible responsive interactions, Next.js rendering boundaries |
| `frontend-dev-2` | sonnet | A second independent UI slice once shared contracts are frozen |
| `motion-dev` | sonnet | Purposeful motion and micro-interactions with reduced-motion fallbacks |
| `backend-dev` | sonnet | APIs, server actions, data access, integrations |
| `system-design-architect` | opus | Cross-layer or high-consequence design before implementation |
| `senior-dev` | opus | Independent correctness and architecture review (read-only) |
| `code-reviewer` | opus | Maintainability, complexity, and naming review (read-only) |
| `security-reviewer` | opus | Static review of auth, injection, data leakage, and supply-chain risks |
| `cyber-security` | opus | Bounded local runtime security tests with disposable fixtures |
| `qa-tester` | sonnet | Acceptance criteria, negative paths, lint, typecheck, tests, and build |
| `qa-visual` | sonnet | Visual fidelity, responsive behavior, interaction, and motion checks |
| `accessibility-specialist` | opus | WCAG, keyboard, focus, and screen-reader audits |
| `performance-engineer` | opus | Measured performance diagnosis and budgets |
| `release-engineer` | opus | Build, CI, environment, and rollback readiness (no deploys) |
| `prompt-engineer` | opus | Improves agent instructions and routing through evals |

## The design studio (UI/UX in Figma)

A 17-agent design team led by `design-director`. It researches, designs, animates, audits and usability-tests products inside one Figma file, and writes no production code. Each product gets a project file at `docs/design/<project>/PROJECT.md`, copied from `docs/design/projects/TEMPLATE-PROJECT.md`.

| Agent | Model | Gates | Owns |
|---|---|---|---|
| `design-director` | fable | all | Brief, critique, gates D0–D8, sign-off; dispatches the others |
| `ux-researcher` | sonnet | D0 | Research, competitor UX, pattern cards, personas with evidence levels |
| `product-designer` | fable | D1–D2 | Concepts, flows, interaction model, annotated wireframes |
| `ui-designer` | fable | D3–D4 | Desktop high-fidelity UI and the module pattern, using the project's design-system library |
| `motion-designer` | opus | D5 | Motion specs, prototypes, launch films |
| `edge-case-specialist` | opus | D2–D4 | Edge-case matrix and every state frame |
| `qa-usability-lead` | opus | D7 | Design QA and the usability-testing programme |
| `design-system-auditor` | sonnet | D6 | Tokens, components and Figma hygiene (independent) |
| `accessibility-localisation-auditor` | sonnet | D6 | WCAG 2.2 AA, localisation/RTL, inclusive design (independent) |
| `product-logic-compliance-auditor` | opus | D6 | Permissions, money states, privacy, regulatory UI (independent) |
| `information-architect` | opus | D2 | Role navigation, object model, sitemap, screen inventory |
| `ux-writer` | opus | D2–D4 | Copy deck in the project's languages, terminology, realistic content |
| `design-system-designer` | opus | M0 + on demand | Product components built once in Figma from accepted proposals |
| `mobile-designer` | opus | D3–D4 | Designed mobile (390) and tablet (1024) layouts |
| `localisation-designer` | opus | D3–D4 | RTL variants, bidirectional text, script typography |
| `data-viz-designer` | opus | D2–D4 | Dashboards, KPIs, charts and reports that answer real questions |
| `design-handoff-specialist` | sonnet | D8 | Developer-ready handoff package |

**Pipeline per module:** D0 research → D1 three concepts (**you choose**) → D2 IA, flows, wireframes and copy in parallel, with edge cases → D3 desktop UI, then mobile, RTL and charts in parallel → D4 states → D5 motion and prototype → D6 three independent audits → D7 QA and usability → D8 developer handoff package and sign-off.

**Start only on your word.** The director reads the sources and replies with a run plan (modules, gates, which agents in which wave, which Figma sections they write). No specialist runs until you say *start*. *Stop* halts new dispatches.

**Parallel waves, up to 12 agents at once.** After the start, the director sends each wave as parallel agent calls: for example twelve ux-researchers on twelve modules, or the three auditors on two modules at once. At most 8 agents write to Figma at the same time, each in its own module page or section. On a Figma rate-limit error the director halves the writers.

**No two agents on the same part.** Every assignment is claimed first in `docs/design/claims.json` (`scripts/claude-team/design-claims.mjs`). The script refuses a claim that overlaps another agent's Figma section, subsection or docs file, or that breaks the 12/8 limits. Dependent work (mobile after the desktop pattern, styling after edge cases, re-audit after fixes) waits with `--after`. Each agent confirms its section before writing, tags its frames with its claim ID and stops if anything is unclear. The director checks every returned agent stayed inside its section, and the design-system-auditor flags any node outside its owner's section.

**How it avoids the "AI-generic" look:**
- `.claude/team/DESIGN-STANDARDS.md` lists 14 generic tells (purple gradients, identical cards, four-KPI dashboards, John Doe placeholder data, greeting banners, rainbow badges, and more). The director, ui-designer and QA lead check every frame against it.
- The studio's binding principles (calm and premium, never a crowded ERP; motion explains, never decorates), the project's design-system library with no hardcoded values, and a 12-point taste rubric with a sign-off bar.
- Realistic fictional fixtures with edge cases, three concept directions per module, and independent audits before sign-off.

**Run it:** `claude --agent design-director` (recommended), or ask the normal PM session, which follows `.claude/team/DESIGN-PLAYBOOK.md`. Setup, smoke tests and troubleshooting are in `docs/design/STUDIO-SETUP.md`.

### Figma MCP or REST API?

| Task | Figma MCP | REST API (`scripts/figma.mjs`) |
|---|---|---|
| Read files, export images | Yes | Yes |
| **Create frames, components, auto layout, text** | **Yes** | **No** (REST cannot create or edit layers) |
| Create variables / tokens | Yes | Enterprise plan only |

Designing in Figma therefore **requires the Figma MCP**, connected under the server name `figma` (`.mcp.json` declares it; sign in once with `/mcp`), plus an **edit (Full) seat** in the team that owns the file. A claude.ai Figma connector in the main session is not passed to the studio agents. REST stays useful for reading, exporting renders and handing the signed-off design to the development team. Details are in `.claude/team/references/FIGMA-BUILD.md`.

## How work flows

1. **Brief.** You describe what you want.
2. **Intake.** The PM checks the real repo state, writes testable acceptance criteria, and picks a risk tier.
3. **Spec.** For Normal and High work, the PM copies `specs/_template/` to `specs/NN-feature/` (requirements, design, tasks).
4. **Build.** Shared foundations come first, then frontend and backend slices. Up to 3 specialists run in parallel, and only on separate files.
5. **Review and QA.** The tier decides which reviews run: senior and code review, QA, and security, visual, or accessibility checks where the task touches those areas.
6. **Finish.** The PM updates `STATE.md`, generates the token report, and reports what changed, how it was verified, and any limits.

| Tier | Example | Gates |
|---|---|---|
| Low | Small text, style, or docs change | Short brief, one relevant review, scoped checks |
| Normal | Feature, UI behavior, integration | Full spec, implementation, senior and code review, QA, plus security and visual QA where relevant |
| High | Auth, payments, sensitive data, schema, major architecture | Normal gates plus architect review, threat model, and expanded tests |

## Folder structure

```
.claude/
  agents/              34 agent definitions (17 development, 17 design studio)
  team/
    PM-PLAYBOOK.md          How the PM runs development delivery
    ENGINEERING-STANDARDS.md Shared quality rules
    DESIGN-STUDIO.md        Studio rules, design system, gates D0–D8 (read by every design agent)
    DESIGN-PLAYBOOK.md      How the PM routes design work to the studio
    DESIGN-STANDARDS.md     The 14 generic-design tells and what to do instead
    PROJECT-PROFILE.md      Facts about the current project (fill this in)
    STATE.md                Current task status (auto-loaded each session)
    *.template.md           Blank templates for profile, state, handoff
    references/             FRONTEND-CRAFT.md, NEXTJS.md, FIGMA-BUILD.md
  hooks/session-start.mjs   Loads STATE.md into the session
  settings.json             Permissions and hook config
specs/_template/        requirements, design, tasks, slice-brief, qa-report
reports/                work-log.jsonl, FINAL-REPORT.template.md, token reports
scripts/
  figma.mjs             Figma REST helper (pages, nodes, images, styles, svg)
  visual-diff.mjs       App screenshot vs Figma render pixel diff
  token-report.mjs      Token usage report from Claude Code transcripts
  claude-team/          Kit validator, snapshot hasher, design work-claims register, tests
tests/
  smoke.mjs             Route smoke test at 1440px and 390px
  a11y.mjs              Keyboard and axe accessibility spot checks
docs/claude-team/       Onboarding, compatibility, validation notes
docs/design/            Studio playbook and setup, project template (projects/TEMPLATE-PROJECT.md)
.mcp.json               Figma MCP server named `figma`
evals/claude-team/      Behavioral eval scenarios for the agents
install.ps1             Copies the kit into another project
CLAUDE.kit.md           Team section appended to the target's CLAUDE.md
.env.example            FIGMA_TOKEN / FIGMA_FILE_KEY placeholders
```

## Requirements

- [Claude Code](https://claude.com/claude-code), a recent version (the studio agents use `mcpServers`, `memory`, `effort` and `maxTurns`), restarted after installing so the agents load
- Node.js for the hook and scripts
- Python 3 with PyYAML 6.0.2 (`scripts/claude-team/requirements.txt`), only for the kit validator
- `playwright` and `pixelmatch`/`pngjs` for tests and visual diff; `axe-core` is optional

## Add it to a new project

```powershell
powershell -ExecutionPolicy Bypass -File <path-to>\claude-team-kit\install.ps1 -Target C:\path\to\new-project
```

The installer:
- copies every kit file and **skips files that already exist** (it never overwrites),
- creates `CLAUDE.md`, or appends the team section from `CLAUDE.kit.md` to an existing one,
- adds `.env`, `.figma/`, `.claude/settings.local.json`, spreadsheets and `private/` to `.gitignore`.

You can also copy the folder contents into the project root by hand. If the project already has a `.claude/` folder or settings, merge them rather than replacing them (see `docs/claude-team/ONBOARDING.md`).

## After installing

1. Fill in `.claude/team/PROJECT-PROFILE.md`, or ask Claude: *"onboard this project using the team kit"*.
2. Copy `.env.example` to `.env` and set `FIGMA_TOKEN` and `FIGMA_FILE_KEY` if you use Figma. Never paste the token into chat.
3. Restart Claude Code, then give the PM a brief.
4. For each feature, copy `specs/_template/` to `specs/01-<feature>/`.
5. For design work, connect the `figma` MCP server (`/mcp`), start `claude --agent design-director`, and point it at your project file (copy `docs/design/projects/TEMPLATE-PROJECT.md` to `docs/design/<project>/PROJECT.md` first). Review its plan, then say *start*.
6. When you're done, run `node scripts/token-report.mjs` and fill in `reports/FINAL-REPORT.template.md`.

## Useful commands

```bash
# Figma
node scripts/figma.mjs pages                  # pages + top-level frames -> .figma/pages.json
node scripts/figma.mjs images <id,id> --scale 2
node scripts/visual-diff.mjs /route <figmaNodeId> --base http://localhost:3000

# Tests (dev server must be running)
node tests/smoke.mjs --routes /,/about
node tests/a11y.mjs --screens /,/about

# Reports
node scripts/token-report.mjs [--session <id>] [--since <ISO date>]
node scripts/claude-team/snapshot.mjs <paths...>   # hash files under review
node scripts/claude-team/design-claims.mjs list    # who is working on which design section

# Validate the kit itself
python scripts/claude-team/validate.py
python -m unittest discover -s scripts/claude-team -p 'validate_test.py'
node --test scripts/claude-team/*.test.mjs
```

## Ground rules

- The team **never pushes to git or deploys**. `release-engineer` only reports release readiness.
- Work is `VERIFIED COMPLETE` only when the essential checks actually ran and no blocking findings remain. A check that couldn't run is reported as `BLOCKED` or `NOT RUN`, never as a pass.
- Secrets stay in `.env` and never appear in chat, logs, or commits.
- Each agent run is tagged by area (for example `[home/desktop/hero]` or `[general/pm]`) so the token report can split usage by area.
