# Design Studio — setup and operations

Setup, smoke tests, configuration and troubleshooting for the design studio inside claude-team-kit. The studio files are already in place when the kit is installed; this page explains how to connect and run them.

## 1. What it is
- A design-only multi-agent team that works inside one Figma file through Figma's MCP server. It researches, designs, animates, audits and usability-tests products.
- It writes no production code.
- **Main agent:** `design-director`, run as the session agent. It dispatches the sixteen specialists through the Agent tool.
- **Specialists:** ux-researcher, information-architect, product-designer, ux-writer, design-system-designer, ui-designer, mobile-designer, localisation-designer, data-viz-designer, motion-designer, edge-case-specialist, qa-usability-lead, design-handoff-specialist, and three independent auditors — design-system-auditor, accessibility-localisation-auditor and product-logic-compliance-auditor.
- **Project:** fill in per project. Each project has `docs/design/<project>/PROJECT.md`, created from `docs/design/projects/TEMPLATE-PROJECT.md`; it names the Figma pages the studio may edit.
- **Figma file key:** fill in per project (`PROJECT.md` → "Figma file", and `.claude/team/PROJECT-PROFILE.md` → "UI and design").

## 2. Architecture

```
claude --agent design-director          (main thread; tools include Agent(<16 specialists>))
   ├── ux-researcher                     WebSearch, WebFetch, figma, playwright (inline)
   ├── information-architect             figma
   ├── product-designer                  figma
   ├── ux-writer                         WebSearch, WebFetch, figma (read)
   ├── design-system-designer            figma
   ├── ui-designer                       figma
   ├── mobile-designer                   figma
   ├── localisation-designer             figma
   ├── data-viz-designer                 WebSearch, WebFetch, figma
   ├── design-handoff-specialist         figma
   ├── motion-designer                   figma
   ├── edge-case-specialist              figma
   ├── qa-usability-lead                 figma, playwright (inline)
   ├── design-system-auditor             figma            ┐
   ├── accessibility-localisation-auditor figma, WebFetch ├─ run in parallel at gate D6, independent
   └── product-logic-compliance-auditor  figma            ┘
```

- **Coordination:** the director runs gates D0–D8 per module (see `.claude/team/DESIGN-STUDIO.md`). Each module gets one Figma page with nine numbered sections, and each section has one owning agent.
- **Shared context:** `.claude/team/DESIGN-STUDIO.md` (studio rules, design-system discipline, gates), project files under `docs/design/<project>/`, and per-agent local memory in `.claude/agent-memory/<agent>/` (gitignored).
- **Why the director must be the main thread:**
  - the `Agent(name, …)` allowlist in its `tools` only applies to an agent running as the main thread (`--agent` or the `agent` setting);
  - subagents cannot ask the user questions — AskUserQuestion is removed for subagents — so specialists return questions to the director, which asks you.
- **Nesting:** specialists should not spawn their own subagents. The director runs up to 12 specialists at once in parallel waves (at most 8 writing to Figma) and dispatches nothing until the owner says start; see `.claude/agents/design-director.md`.

## 3. Requirements
- **Claude Code:** the latest version. The agents use subagent frontmatter fields `memory`, `effort`, `maxTurns`, `mcpServers` (named and inline) and `color`, plus the `Agent(type)` allowlist. Update before debugging anything else.
- **Figma:** an account with edit access to the project's target file (key in `PROJECT.md`), and Figma's MCP server connected to Claude Code under the name `figma`.
- **Node.js** (current LTS), so the inline Playwright MCP server can start through `npx -y @playwright/mcp@latest`.
- **Some agents use Figma's motion and video APIs.** If the account lacks them, the motion-designer falls back to prototype smart animate. That fallback is in its prompt.

## 4. Install
1. Install the kit into the project (`install.ps1`), or open this kit folder directly.
2. **Configure Figma MCP.**
   - `.mcp.json` declares the `figma` server with Figma's remote MCP URL as the default. Set `FIGMA_MCP_URL` only to override it.
   - Alternatively, run `claude mcp add` with `--scope project` and name the server `figma`.
   - Start Claude Code, run `/mcp`, and complete the Figma sign-in.
3. **Trust the folder** when Claude Code asks. Inline MCP servers declared in project agent files (Playwright) load only after the workspace is trusted, and only then do project agents' frontmatter hooks run.
4. **Validate agent files:** `claude plugin validate .claude/agents`. This reports frontmatter that doesn't parse; it needs a recent Claude Code version. For silent skips, start with `claude --debug` and read the log.
5. **Create the project files.** The kit ships no project. Copy `docs/design/projects/TEMPLATE-PROJECT.md` to `docs/design/<project>/PROJECT.md`, fill it in, and create the working files it names (fixtures, status, decisions log). `docs/design/claims.json` is runtime state: it is created on the first claim and is gitignored.
6. **Check your environment.** If you use `--strict-mcp-config`, managed MCP policies or `--bare`, they can block the inline Playwright servers. Check `/mcp` and the startup warnings.

## 5. Smoke tests (run all before the first real module)

| # | Prompt | Expect |
|---|---|---|
| 1 | "List the subagents you can spawn, with their models and tools." | Sixteen specialists, models as in the frontmatter |
| 2 | "Ask the design-system-auditor to run a read-only audit of the Figma page '<an existing designed page>' and return only the health score." | Figma reads work; nothing is edited |
| 3 | "Ask the ux-researcher to fetch the pricing page of <the project's benchmark competitor> and list the plan names with today's date." | WebFetch works; evidence is dated |
| 4 | "Ask the qa-usability-lead to open <a public URL, e.g. the same pricing page> with Playwright and take one screenshot to docs/design/_smoke/." | Playwright starts; the file is saved |
| 5 | "Ask the motion-designer to report whether Figma motion APIs are available on this account, without changing anything." | Reports yes, or falls back |
| 6 | Check `.claude/agent-memory/` | Folders appear for agents that ran |

Delete `docs/design/_smoke/` afterwards.

## 6. Run
- **Interactive:** `claude --agent design-director`. The kit does not make the director the default agent, because plain `claude` is the development PM. From a PM session, follow `.claude/team/DESIGN-PLAYBOOK.md`.
- **First project:** fill in `docs/design/<project>/PROJECT.md`, then follow `docs/design/STUDIO-PLAYBOOK.md` (or the project's prompt pack, if `PROJECT.md` names one), one prompt at a time.
- **Monitor:** `/tasks` shows running subagents with their model and effort; `/usage` shows plan usage; `/mcp` shows server status.
- **Specialist on demand:** @-mention it, e.g. `@"design-system-auditor (agent)" audit <Product> · <Module>`.

## 7. Configuration notes
- **Models:**
  - fable: director, product designer, UI designer (taste-critical work);
  - opus: information architect, UX writer, design-system designer, mobile, localisation, data-viz, motion, edge cases, QA, logic auditor;
  - sonnet: researcher, handoff specialist, design-system auditor, accessibility auditor.
  - Change `model:` per agent to trade quality against cost. Setting `CLAUDE_CODE_SUBAGENT_MODEL` together with `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` forces one model for every subagent.
- **Effort:** set to `high` on all agents. Lower it for the auditors if usage is tight.
- **maxTurns:** set on the researcher (120) and QA. Add it to others if they loop.
- **Memory:** `memory: project` writes to `.claude/agent-memory/<agent>/MEMORY.md`. That folder is gitignored: memory accumulates project-specific learnings, so it stays local to each project and is never committed to the kit. Review it weekly and prune anything wrong. If a learning applies to every project, promote it by editing the agent prompt or `.claude/team/DESIGN-STUDIO.md` instead of committing memory. Clear the folder when you switch the kit to a new project.
- **Descriptions:** keep `description` fields short. Claude Code warns when all agent descriptions together exceed about 15k tokens. Detail belongs in the body.
- **Names:** `name` values must be unique and must not contain `:` or start with `-`.
- **Permissions:**
  - `settings.json` pre-allows the Figma MCP tools, WebSearch and WebFetch so background subagents don't stall on prompts;
  - it denies reading spreadsheets and the `private/` folder;
  - path-rule syntax follows Claude Code's permission rules — confirm in `/permissions` after loading and tighten to your conventions;
  - pre-allowing Figma tools means agents can write to the Figma file without asking. The agents' prompts restrict them to their own sections, and Figma version history is your undo.
- **Porting to the Agent SDK or CI:**
  - the same definitions map one-to-one to the `--agents` JSON or the SDK `agents` option: `description`, `prompt` (= the Markdown body), `tools`, `model`, `mcpServers`, `maxTurns`, `memory`, `effort`;
  - `color` is ignored there;
  - in non-interactive mode, fork mode is off by default and subagents don't run in the background unless you turn it on.

## 8. Data and safety rules (enforce them)
- **Fictional data only:** the project fixtures file. Never real salaries, national ID numbers, bank details, health or customer records, or reviews.
- **No real spreadsheets in the repo.** The `.gitignore` and deny rules help; people still need to follow the rule.
- **Agents may edit only their project's pages** (the pages `PROJECT.md` allows, e.g. "<Product> · …"). They must never edit other products' pages, brief pages, audit pages, reference screens or any page `PROJECT.md` marks as off-limits.
- **R0 synthetic usability results are not evidence.** Real sessions (R1–R3) with real users need consent; anonymise reports.

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Director can't spawn a specialist | Not running as main thread, or a misspelled name in `Agent(...)` | Start with `claude --agent design-director`; check names |
| Agent file ignored | Frontmatter doesn't parse, `---` not on line 1, missing name or description | `claude plugin validate .claude/agents`; `claude --debug` |
| "Agent would be spawned with zero tools" | Tool names misspelled or unavailable | Fix the `tools` list |
| Playwright tools missing | Folder not trusted, Node missing, or strict MCP config | Trust the folder; install Node; check `/mcp` |
| Figma tools missing | Server not named `figma`, or not signed in | `/mcp`; re-authenticate |
| Figma writes fail on fonts or sizing | Fonts not loaded, or sizing set before append | The prompts include these rules; remind the agent |
| `findAll` returns nothing on another page | Page not loaded | Agent must load the page first |
| Motion API "not a supported API" | Feature not enabled for the account | Expected; use the prototype fallback |
| Too many permission prompts | Background subagents surface prompts | Add allow rules, or run with your preferred permission mode |
| Figma rate-limit errors | Too many parallel Figma writers | The director halves the writers; lower the wave size |
| Agents drift from the design system | Prompts not followed, or the library is not filled in `PROJECT.md` | Run design-system-auditor; complete the "Design system" slot; tune the UI designer prompt and record the change in the commit message |
| Director stops before dispatching | `PROJECT.md` missing or has empty slots | Fill in the template slots it reports |

## 10. Versioning
- Record every agent prompt or configuration change in a commit with the reason and the expected effect.
- If the project keeps agent scorecards (e.g. under `docs/design/<project>/scorecards/`), cite the scorecard evidence for the change.
- If designers read agent prompts from a page in the project's Figma file, keep that page in sync.

## 11. File manifest

| Path | Purpose |
|---|---|
| `README.md` | This section |
| `.claude/team/DESIGN-STUDIO.md` | Shared studio context, read by every agent |
| `.claude/team/DESIGN-PLAYBOOK.md` | How a PM session routes design work to the studio |
| `.claude/team/DESIGN-STANDARDS.md` | Banned generic tells and what to do instead |
| `.claude/team/references/FIGMA-BUILD.md` | Figma MCP versus REST, write prerequisites, build verification |
| `.claude/agents/*.md` | Seventeen design agent definitions (plus the kit's development agents) |
| `.claude/settings.json` | Permissions (Figma, WebSearch, WebFetch allowed; spreadsheets and `private/` denied) |
| `.mcp.json` | Figma MCP server (project scope) |
| `.gitignore` | Keeps real data, local files and runtime state (`claims.json`, agent memory) out |
| `scripts/claude-team/design-claims.mjs` | Work-claims register |
| `docs/design/STUDIO-PLAYBOOK.md` | How to run the studio |
| `docs/design/projects/TEMPLATE-PROJECT.md` | Template for each project's `PROJECT.md` |
| `docs/design/<project>/PROJECT.md` | Per project, not shipped: project context, created from the template |
| `docs/design/<project>/…` | Per project, not shipped: fixtures, status, decisions log and module docs named in `PROJECT.md` |
| `docs/design/claims.json` | Runtime, gitignored: created on the first claim |
| `.claude/agent-memory/` | Runtime, gitignored: per-agent local memory |
