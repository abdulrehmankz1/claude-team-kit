# Design standards — avoiding the "AI-generic" look

Applies to the design-director and every design specialist, alongside `.claude/team/DESIGN-STUDIO.md` (studio rules, design system, gates, severity scale). If the two conflict, the studio file and the project's binding rules win. Figma access is in `.claude/team/references/FIGMA-BUILD.md`.

## 1. The generic tells (banned defaults)
These make a design look machine-made. Any one of them in a delivered frame is a finding (usually S3; S2 when it hides the task or misleads), unless the approved brief explicitly asks for it. Cite the tell number in the finding.

| # | Tell | Why it reads as generic |
|---|---|---|
| G1 | Purple/indigo-to-blue gradients, glassmorphism, glowing blobs, gradient text | The default "AI product" palette, chosen without reason |
| G2 | Every surface is the same rounded white card with a soft shadow; icon-in-a-circle + title + two lines, in a 3- or 4-up grid | No hierarchy; nothing matters more than anything else |
| G3 | Dashboard = four KPI tiles with green "+12.5%" chips and a line chart, whatever the role's job | Decoration instead of the decisions the role makes |
| G4 | One font at one or two weights; hierarchy by size only | Flat, template typography |
| G5 | Emoji or ornamental icons; a sparkle icon on anything "smart" | Filler instead of meaning |
| G6 | Placeholder content: John Doe, Acme Inc, lorem ipsum, round numbers, names all the same length, smiling stock portraits | Hides real layout problems; looks fake at once |
| G7 | Even spacing everywhere, everything centred, no grouping | Structure is invisible |
| G8 | An unmodified component-library look (grey defaults + one accent) | Nobody made a decision |
| G9 | "Good morning, Sam! 👋" hero banners inside a work tool | Wastes the most valuable space on the screen |
| G10 | Charts with no question behind them | Data theatre |
| G11 | Rainbow pill badges with no status system | Colour carries no meaning |
| G12 | Long sidebars where every item has the same weight | No information architecture |
| G13 | Floating-people or 3D-shape illustrations as empty-state filler | Stock feel, says nothing |
| G14 | The same layout reused for every module (table page = form page = calendar page) | The shape of the content was ignored |

## 2. What to do instead
1. **Design from the job.** Each screen states the primary role, top task, frequency and the decision it supports. The most frequent action is the most reachable; rare admin actions move into menus.
2. **Density follows the role.** Back-office staff who scan tables all day get compact rows, sticky headers, bulk actions and saved views. Occasional self-service users get calm, guided, mobile-first screens. Approvers get a queue with enough context to decide in one view. The project's roles are in `docs/design/<project>/PROJECT.md`.
3. **Real content first.** Use the project fixtures (the fixtures file named in `docs/design/<project>/PROJECT.md`), including the ugly cases: long names, zero items, many rows, an acting approver, a record that starts mid-period, a foreign-currency amount.
4. **One point of view.** The director's brief names one or two signature ideas for the module (a typographic voice, a distinctive way of showing money or status, a layout rhythm). Apply them consistently; keep everything else restrained.
5. **Typography carries the hierarchy:** library styles, deliberate weight and colour contrast, tabular figures for numbers.
6. **Colour is a system:** accent only for primary action, selection and focus; status colours only for status and always with a label.
7. **Spacing shows structure:** tighter inside a group, larger between groups, everything on the scale.
8. **Form fits content:** tables, forms, calendars, timelines, org charts and approval queues each get the layout that suits them.
9. **Everything earns its place.** If removing an element loses no information or action, remove it.
10. **Specific words:** buttons name the action ("Approve request", not "Submit"); errors say what happened and what to do next.

## 3. Evidence
- A design claim needs a screenshot of the actual frame taken after the last edit, looked at at real size. A gate or verdict without one is BLOCKED, not PASS.
- Record the Figma node ID of every delivered frame in the module docs.
- Findings follow the studio format (ID, S1–S4, frame link, evidence, rule or tell violated, fix, owner).
- Synthetic results (E3) are never reported as user evidence.
