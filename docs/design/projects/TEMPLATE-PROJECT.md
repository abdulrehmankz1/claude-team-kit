# <Project name> — project context (read together with `.claude/team/DESIGN-STUDIO.md`)

Copy this file to `docs/design/<project>/PROJECT.md` and fill in every slot. `.claude/team/DESIGN-STUDIO.md` defers all project-specific facts to this file; anything left blank here is a gap the director reports before dispatching work. Keep `.claude/team/PROJECT-PROFILE.md` ("UI and design") consistent with it.

## What this project is
<One paragraph: product, users, why now.>

## Products and benchmark
- Product(s) in scope: <name and one-line description each>
- Benchmark competitor(s): <names; where we must match them, where we must beat them>

## Figma file
- File key: <key>
- Edit seat: <who holds an edit (Full) seat in the owning team>
- Pages agents may edit: <e.g. "<Product> · …" pages only>
- Pages agents must never edit: <brief pages, audit pages, existing reference screens, any other product's pages>

## Sources (binding)
| Figma page or doc | What it holds | Binding sections |
|---|---|---|
| <master brief page> | <scope> | <roles and permissions, status system, modules, design system and motion, edge cases, flows, acceptance scenarios> |
| <audit / inventory page> | <scope> | |
| <reference screens> | <the reference for density, tone and composition> | |
| <motion reference> | <keyframed scenes, exported video> | |
| <other docs> | <paths> | |

## Design system
- Library: <library name and where it is published>
- Component and variable IDs: <path of the project's Figma reference file>
- Fonts and text styles: <display face and where it is allowed; UI face and named styles, incl. numeric/KPI styles>
- Colour variables: <surface, text, accent, border, status, tone and component groups>
- Radius / spacing / elevation: <scales>
- Library components: <list>
- Desktop layout: <frame width, sidebar, content column, padding, inner width>
- Tablet and mobile: <breakpoints and who uses each>
- Motion tokens: <enter and exit curves, spring, duration bands, stagger, reduced-motion fallback>

## Market and regulatory context
<Each item with evidence level (E1–E3) and date last verified.>
- Invoicing and tax: <mandatory invoicing / point-of-sale rules; what receipts must show>
- Payments: <rails, wallets, instant payments; cash, transfers and instalment norms>
- Messaging: <channels customers expect; how they are charged>
- Data protection: <applicable law or its absence; sensitive data classes>
- Everyday norms: <shared devices, literacy, older users, device and bandwidth realities>

## Languages and direction
- Languages: <list, with the primary language>
- Right-to-left languages: <none, or which, e.g. Arabic or Hebrew> — if any, the "3 · UI / RTL" subsection and the localisation-designer apply
- Script, typography and text-expansion notes: <fonts per script, numerals, expected expansion>

## Naming
Pages "<Product> · <Module>". Frames <Product> / <Module> / <Screen> / <State> / <Breakpoint>[ / RTL].

## Roles
<Exact role names for this product, and which role is accountable for expert decisions (principle 3).>

## Binding rules for this project
<Domain-specific safety rules: e.g. sensitive data classes, consent, segregation of duties, approvals with fallbacks, effective-dated statutory tables, statutory receipts.>
1. <Rule>
2. <Rule>

## Working files
Created by the director at project setup; the director is their only writer.
- Fixtures (fictional data only): <path, e.g. `docs/design/<project>/fixtures.md`> — realistic names for the market, ugly cases (long names, zero items, many rows, shared phone numbers), fictional phone numbers and amounts
- Status: <path, e.g. `docs/design/<project>/status.md`>
- Decisions log (⚑): <path, e.g. `docs/design/<project>/decisions.md`>
- Prompt pack (optional): <path of the owner's ordered start prompts, if any>

## Modules and targets
<Module list with target gate per module.>

## Real users
<Who can join R1–R3, who arranges recruitment and consent.>

## Done means
<The project's definition of comprehensive.>
