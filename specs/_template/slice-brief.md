# Slice brief — rules every slice agent follows

## Read first
- `.claude/team/ENGINEERING-STANDARDS.md`, `.claude/team/PROJECT-PROFILE.md`
- `specs/<NN-feature>/requirements.md`, `design.md`, `tasks.md`
- Your slice file: `specs/<NN-feature>/slices/<id>.md` (you write results here)

## Design access
Use the route in PROJECT-PROFILE.md (kit default: `node scripts/figma.mjs ...`, token from `.env`, never printed).

## Decisions (final, do not ask)
-

## Ownership
| Path | Owner |
|---|---|
| Shared tokens / layout / primitives | |
| package.json / lockfile | |

## Phases
1. Intake → 2. Build → 3. Self-check (lint, tsc, smoke on own routes) → 4. Write slice result → 5. Report to PM.

Tag every agent description like `[area/slice-id]` so `scripts/token-report.mjs` can attribute tokens.
