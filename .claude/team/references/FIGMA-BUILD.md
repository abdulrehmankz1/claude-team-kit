# Figma build reference

How the design team reads and writes Figma. Read with `.claude/team/DESIGN-STANDARDS.md`.

## 1. MCP or REST API?

| Capability | Figma MCP (`use_figma` and friends) | Figma REST API (`scripts/figma.mjs`) |
|---|---|---|
| Read file structure, nodes, styles | Yes (`get_metadata`, `get_design_context`, `get_variable_defs`) | Yes (`pages`, `nodes`, `styles`) |
| Render a frame to an image | Yes (`get_screenshot`) | Yes (`images`) |
| **Create or edit frames, text, auto layout, components** | **Yes** (`use_figma` runs Plugin API code inside the file) | **No.** REST has no endpoint that creates or changes layers |
| Create or edit variables (tokens) | Yes, through `use_figma` | Only on the Enterprise plan (`POST /v1/files/:key/variables`) |
| Post comments | Not needed | Yes |
| FigJam flow diagrams | Yes (`generate_diagram`) | No |

**Conclusion.** Building designs requires the Figma MCP. REST is the read-only route: exporting reference renders, design intake for the dev team (`figma-analyst`), and a fallback for reading when MCP is rate-limited.

The only route to *write* without MCP is a custom Figma plugin that a person runs by hand inside Figma, fed from a JSON spec. That works, but it is not automated, so this kit does not use it by default.

### Prerequisites for writing
- The Figma MCP is connected **under the server name `figma`**. The design agents declare `mcpServers: [figma]` and list only their other tools, so they get Figma tools only from a server with that exact name. The project `.mcp.json` adds Figma's remote server as `figma`; sign in once through `/mcp`. A claude.ai Figma connector in the main session (`mcp__claude_ai_Figma__*`) is **not** passed to these subagents.
- The target file lives in a team where the user has an **edit (Full) seat**. A View seat cannot write. Check with `whoami` if a write is refused.
- MCP calls are rate-limited, and lower plans have much smaller limits. Build in fewer, larger calls, and stop and report on a rate-limit error rather than retrying in a loop.

## 2. Before the first write
Load Figma's `figma-use` skill (Skill tool, or the MCP resource `skill://figma/figma-use/SKILL.md` through ReadMcpResourceTool). Figma's server requires this before calling `use_figma`. Follow its API notes over anything here if they conflict.

## 3. Pages, sections and frames
The studio structure in `.claude/team/DESIGN-STUDIO.md` is binding: one page per module named `<Product> · <Module>`, sections `0 · Brief` to `8 · Handoff` each owned by one agent, and frames named `<Product> / <Module> / <Screen> / <State> / <Breakpoint>[ / RTL]`. The target file key, the project's library and its component and variable IDs are recorded in `docs/design/<project>/PROJECT.md` (the file key also in `.claude/team/PROJECT-PROFILE.md`).

Parallel writing: several agents can write to the same file at the same time only when each holds a claim on a different section, subsection or page (see "Work claims" in `.claude/team/DESIGN-STUDIO.md` and `scripts/claude-team/design-claims.mjs`). Never let two agents write to the same section.

## 4. Verify every build
After building or changing a frame: screenshot it at 100%, check it against the brief, the library rules and the tells G1–G14 in `.claude/team/DESIGN-STANDARDS.md`, fix, and screenshot again. A frame that was never screenshotted is not done.
