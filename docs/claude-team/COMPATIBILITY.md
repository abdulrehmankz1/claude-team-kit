# Runtime and permission notes

Official documentation reviewed 2 October 2026 (Asia/Karachi). Check the installed CLI version before adoption; the CLI was absent from this execution environment.

- Agent definitions use documented name/description/model and tools/disallowedTools fields. They retain sonnet/opus aliases and flat PM delegation. Tool availability can differ by foreground/background, version and enabled features; do not assume all messaging/task tools exist.
- senior-dev/code-reviewer/security-reviewer explicitly allow read/research tools without Bash or file writes. Architect/creative/prompt roles have spec/instruction write policies; path isolation is a prompt boundary unless separately enforced.
- qa-visual/accessibility-specialist/performance-engineer inherit configured tools except file-write and Agent tools so they can discover browser MCPs. Bash/MCP capabilities can still mutate; their no-product-write and authorized-target scope is behavioral policy, not complete sandbox enforcement. Restrict actual adapter tools after discovery when stronger isolation is required.
- Settings use the official settings schema URL and acceptEdits. The local override no longer grants Bash/PowerShell universally or unrelated Figma MCP/dev-device access. Scope-specific Yarn commands preserve approved local workflow; dependency/lifecycle scripts must still be inspected. No blanket interpreter grant is included.
- Read/Edit env rules request sensitive file access. File rules do not prevent every indirect read through shell/MCP. Secret non-disclosure and approved helper consumption remain mandatory; settings are not a complete sandbox.
- No-push deny patterns cover normal Bash/PowerShell use and some prefixed forms; prose also prohibits indirect/alias/API bypass. Patterns alone cannot prove complete enforcement against every possible command.
- SessionStart uses documented Node exec form with args and CLAUDE_PROJECT_DIR. Direct helper behavior was tested locally. Actual Claude injection, settings precedence and Windows CLI loading remain NOT RUN. Manual STATE reading is the older-runtime fallback.
- The profile records inherited application versions rather than claiming detection. Framework guidance is conditional and version/config sensitive, including Cache Components versus the earlier caching model.

Sources:
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/permissions
- https://code.claude.com/docs/en/hooks
- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://nextjs.org/docs/app/guides/data-security
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
