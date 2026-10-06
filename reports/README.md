# reports/

| File | Made by | What |
|---|---|---|
| `work-log.jsonl` | PM, one JSON line per phase event | Timeline source: `{"ts":"<ISO>","event":"start|phase-done","phase":"intake",...}` |
| `token-usage.md` / `.json` | `node scripts/token-report.mjs [--session <id>] [--since <ISO>]` | Token totals by model, area, slice tag, agent run |
| `FINAL-REPORT.md` | PM at the end, from `FINAL-REPORT.template.md` | Result, tokens, timeline, screens, decisions, gaps |

Agent descriptions must carry a tag like `[home/desktop/hero]` or `[general/pm]`; that tag is how tokens get split by area.
