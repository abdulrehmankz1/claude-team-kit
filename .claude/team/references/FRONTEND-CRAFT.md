# Frontend implementation and visual craft

Required reading for both frontend agents, motion-dev and UI reviewers when relevant.

## Design intake to implementation
Read approved frames/screenshots, node IDs, assets, tokens and design gaps. Build a mapping: reference section -> component/path -> tokens/assets -> responsive rules -> required state -> AC ID. Distinguish measured values from inferred behavior. Match typography metrics, line wrapping, grid, whitespace, image crop, icon shape and hierarchy before adding effects. Do not replace approved fonts/icons with convenient defaults without explaining the discrepancy.

Implement semantic structure and useful content first. Choose tokens and component APIs next, then responsive constraints and state behavior. Compare the running screen at the reference dimensions; fix structural mismatch before small cosmetic details. A build log does not prove visual fidelity. Missing approved assets remain an explicit gap, not an invitation to invent client content.

Use max-width, fluid sizing, intrinsic layout and content constraints. Test approved desktop/mobile frames plus intermediate widths, portrait/landscape, long headings, missing images, empty results, 200% text and 400% page zoom where applicable. Avoid fixed-height text clipping, viewport-width overflow, huge absolute-positioned layouts and overflow-hidden used to conceal defects. Use breakpoints where content requires a change, not device marketing names.

## Component decisions
Search the project first. Extract a component for repeated behavior, reusable design or a coherent responsibility; do not abstract every div or add dozens of style-switching props. Preserve the established styling system. Use accessible primitives for complex controls if available; verify their integration rather than assuming the library makes all usage accessible. Share contracts and token ownership before parallel work.

## State and interactions
Distinguish initial/loading/empty/partial/success/error/unavailable/disabled states. Reserve space where useful and expose recoverable errors. Keep fields after recoverable failure, prevent duplicate submission and restore meaningful focus. Use links for navigation and buttons for actions; avoid clickable divs, nested interactive elements and hover-only information.

Keep server data, URL state, form state and local interaction state separate. Derive values instead of synchronizing redundant state through effects. Cancel obsolete work or guard response ordering. Specify optimistic rollback and idempotency for consequential mutations. Never replace failed API data with undisclosed mocks.

## Accessibility baseline
Aim for WCAG 2.2 AA as applicable: names, roles, semantics, meaningful headings, labels, keyboard operation, visible focus, contrast, announcements and error recovery. Dialogs require focus containment/return, Escape behavior and a background interaction strategy. Menus, tabs and accordions require correct keyboard and semantic patterns. Visual focus must remain visible while scrolling and under sticky headers.

A 44px touch target is a useful project preference, not the universal WCAG AA minimum; evaluate WCAG 2.5.8's 24 CSS px criterion, spacing and exceptions correctly. Do not claim conformance from an automated score. Test reduced motion, forced colors or screen-reader behavior when relevant and tooling permits.

## Verification and performance
Capture route, viewport, DPR, reference node, app mode and snapshot with screenshots. Compare in a stable state; account for font rendering and dynamic content without ignoring genuine deviations. Record perceptual issues and measured values; do not invent exact pixel measurements from memory.

Keep critical content visible before JavaScript loads and when effects fail. Reserve image/video dimensions, choose correct sizes, avoid excessive priority/preload and handle missing/slow assets. Measure bundle/interaction changes before adding memoization or another library. Performance results need real device/network/tool conditions and a baseline.

Read `.claude/team/references/NEXTJS.md` only when the actual stack is Next.js; none of these instructions authorize framework migration.
