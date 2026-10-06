# QA report — <feature> (<risk tier>)

## Verdict
PASS / FAIL / BLOCKED — one line on why.

## Gates
| Gate | Command | Result | Evidence |
|---|---|---|---|
| Lint | | | |
| Typecheck | | | |
| Build | | | |
| Route smoke | `node tests/smoke.mjs --routes /,...` | | `tests/smoke-results.json` |
| Visual diff | `node scripts/visual-diff.mjs <route> <figmaNodeId>` | | |
| Keyboard / a11y | `node tests/a11y.mjs --screens /,... --dialogs ...` | | |

## Defects
### D1 (severity, AC): title
Repro, expected, actual, owner.

## AC status
| AC | Status | Evidence |
|---|---|---|
| AC-01 | NOT RUN | |

## Artifacts
