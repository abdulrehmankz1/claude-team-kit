# Design Studio — shared context

This file holds the universal studio rules. Everything specific to one product lives in two places, filled in per project:
- **`docs/design/<project>/PROJECT.md`** — created from `docs/design/projects/TEMPLATE-PROJECT.md`. Product, users, Figma file and pages, design-system library, sources and briefs, market and regulatory context, languages, roles, fixtures, binding rules, modules and targets.
- **`.claude/team/PROJECT-PROFILE.md`** — the kit-wide project profile ("UI and design": tokens, fonts, Figma write route, target file key, design project folder, viewports, accessibility target).

## Active project
- Fill in per project: the active project and its folder `docs/design/<project>/`.
- Read `docs/design/<project>/PROJECT.md` before any work. Its binding rules take precedence on every page of that project.
- Domain-specific safety rules (for example professional hand-offs, consent, statutory receipts, sensitive personal data, segregation of duties) are declared in the project file. Apply them as binding rules, alongside the universal principles below.
- Work only on the project(s) the owner has made active. Do not start another product until the owner says so.

## What this studio does
We design products inside Figma. The products, their market and the benchmark competitors are described in `docs/design/<project>/PROJECT.md` (fill in per project). Where the project names a benchmark competitor, we match it on what the target users actually use and beat it on fit for their market.

This studio designs only. We do not write production code. Our output is a Figma file a development team can build from without guessing.

## Sources of truth
- **Figma file key:** fill in per project (`docs/design/<project>/PROJECT.md` → "Figma file"; also recorded in `.claude/team/PROJECT-PROFILE.md`).
- **Brief and source pages:** listed in `docs/design/<project>/PROJECT.md` → "Sources (binding)", with what each page holds (master brief and its binding sections for roles, statuses, modules, design system, edge cases, flows and acceptance scenarios; audits; feature inventories; existing designed screens used as the reference for density, tone and composition; motion references).
- **Component and variable IDs:** recorded per project in the Figma reference file named in `PROJECT.md` (the design-system-designer maintains it).

## Design system — the project's library (never hardcode)
Every frame is built from the project's design-system library, named in `docs/design/<project>/PROJECT.md` → "Design system". Never hardcode a colour, font, size, radius, spacing, shadow or duration; bind to the library's variables and styles, and use its components rather than drawing one-offs. If something is missing, the design-system-designer proposes and builds it as a real component; nobody else invents a local substitute.

Fill in per project (in `PROJECT.md`):
- **Fonts and text styles:** the display face and where it may appear; the UI face and its named text styles (headings, body, labels, buttons, links, overlines, data/KPI and numeric styles with tabular figures).
- **Colour variables:** surfaces, text, accent, borders, status and tone pairs, plus component-level groups (button, input, nav, selection).
- **Radius, spacing and elevation scales.**
- **Library components:** the list agents must use.
- **Layouts:** desktop frame width, sidebar, content column, padding and inner width (matching the reference screens); tablet and mobile breakpoints and who uses each.
- **Motion tokens:** enter and exit curves, spring range, duration bands (micro, UI, emphasis), stagger, and the reduced-motion fallback.

Universal motion rules, whatever the tokens: motion uses the project's curves and duration bands only; reduced motion falls back to a short cross-fade; never animate money at checkout or at any moment of payment confirmation.

## Binding product principles
1. **Calm and premium.** Never a crowded ERP.
2. **Least privilege.** View, edit, approve and export are separate grants.
3. **Expert decisions stay with the accountable role.** Front-desk or support roles send and request; the accountable professional accepts, starts, completes and confirms. The project file names these roles.
4. **Money is never ambiguous.** Booked, invoiced, collected, verified, refunded and outstanding are always separate.
5. **Every state has an owner, a next step and a fallback.**
6. **Nothing silent.** Every failure has a specific recovery.
7. **Privacy in shared spaces.** Lock screens, shared-desk views and phone lookups never reveal more than the minimum.
8. **No self-approval.**
9. **Messaging is cost-aware.** Use the channels the project's users actually use; transactional messages by default; cost shown before bulk sends.
10. **Real-world payments are first-class.** Where the market uses cash, transfers, wallets or instalments, shifts, verification and controls are designed, not bolted on.
11. **Fit the market.** The languages, scripts and direction, devices, bandwidth and literacy levels in `PROJECT.md` are design inputs, not afterthoughts.
12. **Motion explains, never decorates.**
13. **One design system.** Each product is a theme and a vertical pack, not a new style.

Projects may add binding rules in `PROJECT.md`; they never weaken these.

## Market and regulatory context (the researcher re-verifies monthly)
Fill in per project in `docs/design/<project>/PROJECT.md` → "Market and regulatory context". Cover at least:
- **Invoicing and tax:** mandatory invoicing or point-of-sale integrations, and what receipts must show.
- **Payments:** the payment rails, wallets and instant-payment schemes in use; how common cash, transfers and instalments are.
- **Messaging:** which channels customers expect and how they are charged.
- **Data protection:** the applicable law (or its absence), and which data classes are treated as sensitive.
- **Everyday norms:** shared devices, languages and scripts, literacy, accessibility needs of older users, device and bandwidth realities.

Each item carries its evidence level and the date it was last verified.

## Studio rules
- **Fictional data only.** Use the project fixtures file named in `PROJECT.md`. Never use real customer, patient or staff data, even if visible elsewhere in the file.
- **Owner decisions (⚑).** Agents propose options and a recommendation, the director logs them in the project's decisions log, and agents never decide.
- **Evidence levels — label every insight:**
  - **E1** — observed with real users;
  - **E2** — secondary research, analytics or published sources;
  - **E3** — expert judgement or synthetic simulation.
  - Never present E3 as E1.
- **Competitors and inspiration.** Public sources only. Borrow principles, never pixels. Quote at most 15 words.
- **Figma ownership.** Each module page has numbered sections. An agent edits only its own section. Auditors and QA never edit design frames — they annotate in their own sections.

## Figma page structure — one page per module, named `<Product> · <Module>`
| Section | Owner |
|---|---|
| 0 · Brief | design-director |
| 1 · Research | ux-researcher |
| 2 · Flows & wireframes / IA | information-architect |
| 2 · Flows & wireframes / Flows | product-designer |
| 3 · UI / Desktop | ui-designer |
| 3 · UI / Mobile & tablet | mobile-designer |
| 3 · UI / RTL | localisation-designer |
| 3 · UI / Charts & reports | data-viz-designer |
| 4 · States & edge cases | edge-case-specialist, then ui-designer for the styling pass (one after the other, never together) |
| 5 · Motion & prototype | motion-designer |
| 6 · Audits / Design system, / Accessibility & localisation, / Product logic & compliance | one auditor each |
| 7 · Testing | qa-usability-lead |
| 8 · Handoff | design-handoff-specialist, then the director's sign-off note |

Outside module pages: `<Product> · Components` belongs to design-system-designer. ux-writer works in docs (`copy.md`) and reviews frames without editing them. The "3 · UI / RTL" subsection applies only when `PROJECT.md` lists a right-to-left language.

## Work claims — one owner per part, always
Two agents never work on the same Figma section, subsection or docs file at the same time. Mistakes from overlapping edits (overwritten frames, duplicate components, conflicting copy) are the most expensive kind, so this is enforced, not just intended.

1. **Claim before dispatch.** The director records every assignment in `docs/design/claims.json` (runtime state, gitignored, created on the first claim) with `node scripts/claude-team/design-claims.mjs claim …`: claim ID (`<agent>#<module>`, e.g. `ui-designer#M2`), page, section or subsection, and every docs path the agent will write. A section claim covers all its subsections, so "3 · UI" blocks "3 · UI / RTL". The script refuses overlaps, more than 12 active agents and more than 8 Figma writers. A refused claim is not dispatched.
2. **Sequence with `--after`.** Work that depends on another agent's result (mobile after the desktop pattern, the styling pass after the edge-case frames, re-audits after fixes) is claimed with `--after <claim ID>` and cannot start until that claim is released.
3. **Single writers for shared files.** The project's status file, decisions log and fixtures file (paths in `PROJECT.md`) and `claims.json` are written only by the director. `docs/design/<product>/components.md` only by design-system-designer. Everyone else proposes changes in their result; the director applies them.
4. **Every delegation carries the claim:** claim ID, page, exact section path, writable docs paths, and "if anything is outside this, stop and report".
5. **Agents check before writing.** Before the first Figma write, an agent finds its page and its own section node by exact name, confirms it matches the claim in its delegation, and writes only inside it. It never moves, renames or deletes nodes outside its section. If the section is missing, has unexpected recent content from someone else, or the claim does not match, it stops and reports instead of working around it.
6. **Owner tags.** Where the Figma API allows it, agents tag every top-level frame they create with shared plugin data (namespace `studio`, keys `owner` = claim ID and `section`), so audits can see who made what.
7. **Release and verify.** When an agent returns, the director checks its changes stayed inside its section (screenshots and `get_metadata` of the page), then releases the claim with a note. The design-system-auditor reports any node found outside its owner's section as an S2 finding.
8. **One director per Figma file.** The register is an assignment list for one dispatcher, not a lock across sessions. Do not run two director sessions on the same file at once.

Frame names follow `<Product> / <Module> / <Screen> / <State> / <Breakpoint>[ / RTL]`. Never use "Frame 182".

## Design gates (the director runs them)
| Gate | Passes when |
|---|---|
| D0 Discovery | Research pack and inspiration brief exist, with evidence levels |
| D1 Framing | Design brief, jobs, success measures and three concept directions reviewed |
| D2 Structure | IA and inventory, flows, interaction model, annotated wireframes and the copy deck approved |
| D3 UI | Hi-fi screens for every inventoried screen at every required breakpoint, RTL variant (where required) and chart, built from components |
| D4 States | Edge-case matrix complete; every state designed |
| D5 Motion | Motion spec and working prototype for the main journey and top failure paths |
| D6 Audits | All three auditors return PASS (no open S1 or S2) |
| D7 Testing | QA conformance PASS; usability round meets the bars in the test plan |
| D8 Sign-off | Director taste rubric met; handoff package complete |

## Shared severity scale for findings
| Level | Meaning |
|---|---|
| S1 Blocker | Breaks a binding rule, exposes data, or a core task fails |
| S2 Major | Causes errors, confusion or exclusion for a role or group |
| S3 Minor | Friction or inconsistency with a workaround |
| S4 Polish | Craft improvements |

Each finding records: ID, severity, location (frame link), evidence, rule or heuristic violated, recommended fix, and owner.
