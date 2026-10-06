# Validation results

Executed 2 October 2026 (Asia/Karachi).

| Check | Result | Scope |
|---|---|---|
| python3 scripts/claude-team/validate.py | PASS | 17 exact roles, parsed YAML/JSON, known-subset settings fields, no-push config, reviewer tools, imports/reference paths, 17-case evaluation schema |
| python3 -m unittest discover -s scripts/claude-team -p 'validate_test.py' | PASS: 8 tests | Valid kit and failure detection for missing agent/reference, duplicate YAML, shell escalation, no-push removal and broken hook arguments |
| node --test scripts/claude-team/*.test.mjs | PASS: 7 tests | Hook missing/oversize/path edge cases; snapshot determinism/change detection, traversal/secret/missing-file and symlink rejection |
| Claude agent loading/invocation | NOT RUN | Claude Code not installed here; verify in target checkout |
| Project lint/typecheck/build/browser/Figma/security checks | NOT RUN | Product app, specs, assets, integration scripts and browser fixtures not attached |
| Live baseline-versus-upgraded behavior evaluation | NOT RUN | 17 scenario assets supplied; no measured behavioral performance claim |

Execution environment: Python 3.12.14, Node 24.19.0. Validation uses PyYAML safe parsing. Target project runtime version remains inherited until measured. Static validation is deliberately a documented kit-subset check; it does not establish full Claude schema acceptance, managed policy behavior, cross-platform loading, application conformance or production readiness.

All 12 original invocation names preserved; 5 new roles added. All 19 original archive paths retained in the corrected package, with their contents updated as appropriate. No product implementation, remote push or deployment occurred.
