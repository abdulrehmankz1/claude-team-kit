# PM design playbook — routing design work to the design studio

Applies to the main session when the brief is UI/UX design in Figma rather than code. The design team is the Design Studio: 17 agents, `design-director` plus 16 specialists. Its full rules live in `.claude/team/DESIGN-STUDIO.md`; how to run it is in `docs/design/STUDIO-PLAYBOOK.md`; setup and troubleshooting are in `docs/design/STUDIO-SETUP.md`. Project-specific facts (Figma file, library, sources, market, languages, roles, fixtures) live in `docs/design/<project>/PROJECT.md`, created from `docs/design/projects/TEMPLATE-PROJECT.md`.

## 1. Two ways to run it
1. **Recommended: start a design session as the director.** `claude --agent design-director`. The director runs as the main thread, may only spawn its 16 specialists, and can ask the owner questions directly.
2. **From a normal PM session.** Read `.claude/agents/design-director.md` and act as the director for this brief: follow its start gate, parallel waves, gates D0–D8, critique protocol and sign-off rules. Spawn the specialists directly (flat delegation). Do not spawn `design-director` as a subagent: subagents cannot ask the owner questions, and this kit's specialists do not delegate further.

## 2. Start gate
Never dispatch a design specialist until the owner explicitly says to start ("start", "go", or a prompt from the project's prompt pack naming modules and gates). Before that, read `docs/design/<project>/PROJECT.md` and its sources and reply with a run plan: modules, gates, waves with agent names and counts, the pages and sections each agent writes, and the ⚑ decisions that will pause the run.

## 3. Parallelism
Up to **12 specialists at once**, sent as several Agent calls in one message; at most 8 of them writing to Figma. Several instances of one agent are fine when each has its own module. Different modules can be at different gates; one module's gates stay in order. Halve the Figma writers after any rate-limit error. The wave table is in `.claude/agents/design-director.md`.

**No two agents on the same part.** Claim every assignment first with `node scripts/claude-team/design-claims.mjs claim …` (rules: "Work claims" in `.claude/team/DESIGN-STUDIO.md`). The script refuses overlapping sections or docs paths and the 12/8 limits; dependent work waits with `--after`. Put the claim in each delegation, verify the agent stayed in its section, then release it.

## 4. Team

| Agent | Gates | Owns |
|---|---|---|
| design-director | all | Brief, critique, gates, sign-off (never designs screens) |
| ux-researcher | D0 | Research, competitor UX, pattern cards, personas, evidence levels |
| product-designer | D1–D2 | Concepts, flows, interaction model, annotated wireframes |
| ui-designer | D3–D4 | Desktop high-fidelity UI and the module pattern, with the library |
| motion-designer | D5 | Motion specs, prototypes, launch films |
| edge-case-specialist | D2–D4 | Edge-case matrix and every state frame |
| qa-usability-lead | D7 | Design QA and the usability-testing programme |
| design-system-auditor | D6 | Tokens, components, Figma hygiene (independent) |
| accessibility-localisation-auditor | D6 | WCAG 2.2 AA, localisation and RTL, inclusive design (independent) |
| product-logic-compliance-auditor | D6 | Permissions, money states, privacy, regulatory UI (independent) |
| information-architect | D2 | Role navigation, object model, sitemap, screen inventory |
| ux-writer | D2–D4 | Copy deck in the project's languages; terminology; fixture realism |
| design-system-designer | M0, on demand | Product components in Figma, built once from accepted proposals |
| mobile-designer | D3–D4 | Designed mobile (390) and tablet (1024) layouts |
| localisation-designer | D3–D4 | Localised and RTL variants, bidirectional text, script typography |
| data-viz-designer | D2–D4 | Dashboards, KPIs, charts and reports with definitions |
| design-handoff-specialist | D8 | Developer-ready package in section 8 |

The development team's `figma-analyst` takes over after D8 to turn the signed-off file into code.

## 5. Prerequisites to check before the first start
- Figma MCP connected under the server name `figma` (see `.claude/team/references/FIGMA-BUILD.md`) and signed in through `/mcp`.
- The owner has an edit seat in the team that owns the target file.
- Node.js available for the Playwright MCP used by the researcher and QA lead.
- `docs/design/<project>/PROJECT.md` exists, filled in from the template, and the working files it names (fixtures, status, decisions log) exist.
- `.claude/team/PROJECT-PROFILE.md` ("UI and design") names the target file key and the design project folder.
If one is missing, report it as BLOCKED with the exact next step; research and written work can still proceed where tools allow.
