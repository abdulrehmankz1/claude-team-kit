# Claude Team Kit

A drop-in kit that turns Claude Code into a small software team for any project. The main Claude session acts as **PM** (project manager), and 17 specialist agents (frontend, backend, QA, security, accessibility, Figma, and more) take on focused work. The kit also includes spec templates, Figma helpers, test scripts, and token-usage reporting.

> **Roman Urdu mein khulasa:** Yeh kit kisi bhi naye project mein copy ki jati hai taake Claude Code aik poori team ki tarah kaam kare. Main session PM hota hai: woh brief leta hai, spec banata hai, aur kaam sahi specialist agent (frontend, backend, QA, security wagera) ko deta hai. Har kaam ka risk tier hota hai (Low / Normal / High), aur kaam tab hi "VERIFIED COMPLETE" mana jata hai jab asal checks chal chukay hon. Saath mein Figma se design nikalne, screenshot comparison, smoke/a11y tests aur token report ke scripts bhi hain.

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

## The agent team

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
  agents/              17 specialist agent definitions
  team/
    PM-PLAYBOOK.md          How the PM runs delivery
    ENGINEERING-STANDARDS.md Shared quality rules
    PROJECT-PROFILE.md      Facts about the current project (fill this in)
    STATE.md                Current task status (auto-loaded each session)
    *.template.md           Blank templates for profile, state, handoff
    references/             FRONTEND-CRAFT.md, NEXTJS.md
  hooks/session-start.mjs   Loads STATE.md into the session
  settings.json             Permissions and hook config
specs/_template/        requirements, design, tasks, slice-brief, qa-report
reports/                work-log.jsonl, FINAL-REPORT.template.md, token reports
scripts/
  figma.mjs             Figma REST helper (pages, nodes, images, styles, svg)
  visual-diff.mjs       App screenshot vs Figma render pixel diff
  token-report.mjs      Token usage report from Claude Code transcripts
  claude-team/          Kit validator, snapshot hasher, tests
tests/
  smoke.mjs             Route smoke test at 1440px and 390px
  a11y.mjs              Keyboard and axe accessibility spot checks
docs/claude-team/       Onboarding, compatibility, validation notes
evals/claude-team/      Behavioral eval scenarios for the agents
install.ps1             Copies the kit into another project
CLAUDE.kit.md           Team section appended to the target's CLAUDE.md
.env.example            FIGMA_TOKEN / FIGMA_FILE_KEY placeholders
```

## Requirements

- [Claude Code](https://claude.com/claude-code), restarted after installing so the agents load
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
- adds `.env`, `.figma/`, and `.claude/settings.local.json` to `.gitignore`.

You can also copy the folder contents into the project root by hand. If the project already has a `.claude/` folder or settings, merge them rather than replacing them (see `docs/claude-team/ONBOARDING.md`).

## After installing

1. Fill in `.claude/team/PROJECT-PROFILE.md`, or ask Claude: *"onboard this project using the team kit"*.
2. Copy `.env.example` to `.env` and set `FIGMA_TOKEN` and `FIGMA_FILE_KEY` if you use Figma. Never paste the token into chat.
3. Restart Claude Code, then give the PM a brief.
4. For each feature, copy `specs/_template/` to `specs/01-<feature>/`.
5. When you're done, run `node scripts/token-report.mjs` and fill in `reports/FINAL-REPORT.template.md`.

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
