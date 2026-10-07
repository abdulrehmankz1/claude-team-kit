# Running the Design Studio

## Setup (once per project)
1. Install the claude-team-kit (it puts the studio context in `.claude/team/DESIGN-STUDIO.md` and the seventeen design agents in `.claude/agents/`). Restart Claude Code if that folder is new.
2. Connect Figma's MCP server under the name `figma`. The kit's `.mcp.json` already declares it; run `/mcp` and sign in.
3. Make sure Node.js is installed so the Playwright browser tool can start through npx. The researcher and QA lead use it.
4. Create the project folder: copy `docs/design/projects/TEMPLATE-PROJECT.md` to `docs/design/<project>/PROJECT.md` and fill in every slot (Figma file key, design-system library, sources and briefs, market and regulatory context, languages and RTL, roles, binding rules, working files, modules). Record the file key and design project folder in `.claude/team/PROJECT-PROFILE.md` ("UI and design").
5. Create the project fixtures file named in `PROJECT.md`, with fictional people whose names fit the project's market (including overseas customers and a shared family number), fictional phone numbers and amounts.
6. Create the status file and decisions log named in `PROJECT.md`. They can start empty; the director maintains them. `docs/design/claims.json` is created automatically on the first claim (runtime state, gitignored).

## Start every session as the director

    claude --agent design-director

## The pipeline for one module
D0 research → D1 framing and three concepts → D2 flows and wireframes (edge cases start in parallel) → D3 UI → D4 states → D5 motion and prototype → D6 three audits in parallel → D7 QA and usability → fixes and re-audits → D8 sign-off and handoff.

## First prompts to give the director
If the project has a prompt pack (named in `PROJECT.md`), use it one prompt at a time, in order. Otherwise, example prompts (replace `<Product>` and the module names with your own):
1. "Set up the studio: read `docs/design/<project>/PROJECT.md`, check the status and decisions files exist, and propose the module order for <Product>."
2. "Run D0 for <Product> · Follow-ups and <Product> · Messaging inbox in parallel."
3. "Take <Product> · Follow-ups through D1 and D2; show me the three concepts with your recommendation."
4. "Run D6 audits on <Product> · Follow-ups and summarise the findings by severity."
5. "Prepare the usability test plan for <Product> · Follow-ups and run R0; list what we need from me to run R1 with real users."

## Working rules
- **Start only on the owner's word.** The director plans and waits; no specialist runs until you say start.
- **Parallel waves, up to 12 agents at once** (at most 8 writing to Figma). Different modules can be at different gates; one module's gates stay in order. Build in parallel only after M0 Foundations and one pilot module pass D3.
- **Edit ownership:** agents edit only their own Figma section. Auditors and QA never edit design frames.
- **Independent audits:** the three auditors run in parallel and never read each other's reports first.
- **Synthetic testing (R0) is a rehearsal.** It is not evidence. Plan real sessions (R1–R3) with the product's real users — you arrange recruitment and consent.
- **Narrow requests** produce better work and cost less: "<Product> · Billing", not "<Product>".
- **Owner decisions:** you are the owner. Only you answer ⚑ questions.
