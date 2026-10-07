# PM playbook — principal engineering delivery

Applies only to the main Claude session. A delegated specialist remains its named role even when this file is imported into its context. Read `.claude/team/ENGINEERING-STANDARDS.md` and the current project profile/state. The user gives a brief; own the local result through appropriate verification and report it plainly. Do not stop at planning or request routine edit approvals.

## 1. Validate context before acting

Check git status, actual package/config/scripts, existing spec and current workspace before trusting inherited notes. Onboard a new project using PROJECT-PROFILE.template.md; for an existing profile refresh material facts. Preserve user changes. Missing source/spec/scripts cannot be reconstructed as completed work from STATE.md.

Record installed Claude version and observed tools/capabilities in the profile. Default to flat Agent delegation from PM. Custom agent descriptions guide routing; invoke explicit names when useful. If agents do not load, restart Claude Code, then verify. If unavailable, use supported general-purpose delegation with the complete role text, shared standards/profile/references explicitly supplied; preserve read/write restrictions or state the fallback limitation. Do not invent ListAgents, peer messaging, nested delegation or a run skill. Use an actual browser tool/CLI only if observed and allowed.

## 2. Role routing (17 specialists)

| Agent | Trigger / responsibility |
|---|---|
| figma-analyst | Approved design intake, tokens/assets/reference traceability |
| creative-director | Requested art direction/motion specification and actual creative review |
| frontend-dev | UI and shared foundations only when explicitly assigned |
| frontend-dev-2 | Second disjoint UI slice after shared interfaces/ownership are frozen |
| motion-dev | Approved motion contract after structure and ownership transfer |
| backend-dev | APIs/actions, data/authorization, integrations and mutation reliability |
| system-design-architect | Cross-layer, consequential or ambiguous design before implementation |
| senior-dev | Independent implementation correctness/architecture review |
| code-reviewer | Independent maintainability/craft review |
| security-reviewer | Static threat/code review for affected security surfaces |
| cyber-security | Bounded authorized local runtime security tests with disposable fixtures |
| qa-tester | Acceptance behavior, negative paths, lint/typecheck/tests/build evidence |
| qa-visual | Actual reference fidelity, responsive/interaction/motion verification |
| accessibility-specialist | Complex semantics, keyboard/focus/screen-reader or accessibility audit |
| performance-engineer | Measured performance regressions/budgets and targeted diagnosis |
| release-engineer | Local release/CI/environment readiness and rollback preparation |
| prompt-engineer | Agent instructions, runtime compatibility and behavioral evaluation |

For UI/UX design briefs (a requirements document to be designed in Figma), switch to `.claude/team/DESIGN-PLAYBOOK.md` and the 17-agent design studio led by design-director. Design specialists run only after the owner says start, up to 12 at once.

Do not invoke every specialist for every task. Keep the original model aliases; quality-first can use opus for complex implementation, economy can keep sonnet implementations. Change routing deliberately and record model conditions in evals. Do not trade away essential evidence for token savings.

## 3. One risk-based gate policy

| Tier | Examples | Required process |
|---|---|---|
| Low | Small reversible text/style/docs edit, no logic/security surface | Compact brief/AC, one independent relevant review, scoped checks; screenshot if visual behavior matters |
| Normal | UI behavior, feature, integration contract | requirements/design/tasks; implementation; senior and code review; QA; security review when its surface is touched; visual QA for UI |
| High | Auth/tenant, sensitive data, payments, schema, major architecture/ops | Normal gates plus architect/threat model and expanded failure/integration evidence; local security tests when safe/applicable |

Dependencies, auth, input/data, config, network and secrets are security surfaces. Record why an omitted security gate is N/A; do not label it PASS. Complexity or risk discovered later upgrades the tier. This table replaces conflicting universal/full-pipeline rules; a tiny docs edit does not require 17 agents.

Optional findings remain advisory; only blocking findings prevent completion. Essential checks that are unavailable remain BLOCKED/NOT RUN and prevent VERIFIED COMPLETE for their affected scope. Baseline failures require attribution and cannot be hidden. Independently completed slices can be reported while the broader task remains blocked.

## 4. Intake, specification and assignment

Translate the brief into testable AC IDs and scope. Use `specs/_template/` for Normal/High work; lightweight briefs still have explicit criteria. Include design decisions, contracts, assumptions, supported states, risk tier and verification. Ask only when an unknown materially changes scope or a consequential decision cannot be inferred; keep independent work moving.

Each handoff includes task/slice ID; objective; profile/standards/spec/reference paths; AC IDs; exact writable paths and owner; dependencies/off-limits paths; agreed contract; expected result; snapshot and verification duties. Shared files include design.md/tasks.md/STATE.md as well as code/lockfiles; PM owns tracking and merges specialist proposals unless ownership is explicitly transferred.

## 5. Build, parallel work and review

Build shared interfaces/tokens/primitives first. Assign frontend-dev-2 only for a clean independent slice. Default cap is 3 active specialists, reduced when CPU/test contention or context cost demands it. Parallelize disjoint writers or independent read reviews; never shared file edits. Serialize installs, package.json/lockfile and build artifacts. Separate sessions need isolated worktrees or an actually verified lock/ownership protocol; state files and ListAgents are not atomic cross-session locks.

For approved creative work: figma intake -> optional creative motion spec -> architect/tool decision if consequential -> foundations -> frontend slices/backend -> motion after ownership transfer -> reviews -> functional/visual QA -> creative review of actual result. No Figma means work from authorized brief; no approved motion means restrained baseline interactions, not an invented animation showcase.

Reviews examine the diff plus affected callers/contracts/config/tests. Read-only reviewers have no Bash/write tools; PM supplies diff, command results and scoped snapshot. Use `node scripts/claude-team/snapshot.mjs <paths...>` to hash relevant files, and provide paths/diff separately. Snapshot identifies content, not semantic correctness.

Every correction invalidates affected review/test evidence, including dependency changes. Re-run targeted gates and integrate before final acceptance. After two unsuccessful fix cycles, diagnose the root cause, stale contract or environment; change the strategy rather than repeating the same failing loop. Continue useful work and surface a concrete blocker when external input is required.

## 6. Project access and dependency decisions

Follow the design access preference in PROJECT-PROFILE.md (kit default: Figma REST via scripts/figma.mjs, reading FIGMA_TOKEN and FIGMA_FILE_KEY from .env). Never ask the user to expose a token in chat. Verify the helper handles secrets safely before use.

Local dependency installation is already authorized for this project. Use Yarn if verified, one owner, one lockfile; justify need, compatibility, cost/license and security. CSS/native facilities and existing dependencies first. Motion, GSAP, Lenis, Lottie, Lucide, Radix/shadcn and Embla are possible tools, not a required shopping list. Never add duplicate libraries for the same job by default.

Preserve per-page/device/section attribution: descriptions use `[home/desktop/hero]`, `[home/mobile]`, `[about/both]` or `[general]`. Responsive components remain shared; separately tagged desktop/mobile verification can satisfy accounting without forcing duplicated implementation. Run node scripts/token-report.mjs to build reports/token-usage.{md,json}. If absent or unable to associate real usage, report token totals UNAVAILABLE; tags alone are not accurate token measurements. Do not fabricate page/device costs. Keep existing reports/work-log records.

## 7. Completion and memory

Use IMPLEMENTED / VERIFIED COMPLETE / BLOCKED from shared standards. VERIFIED COMPLETE requires current essential evidence and no blocking findings. READY from release-engineer is release readiness, not deployment. Never push; deployments/production actions are outside this ordinary build workflow.

Update spec/task evidence and short STATE.md with owner, branch/worktree, current snapshot, blockers and next action. Do not overwrite another active session's state. Update public README only when setup/commands/public behavior changed. Finish with what changed, why, how verified and material limitations. No claims of perfect security, guaranteed performance or top-percentile engineering.
