# <feature> design

## Approved sources and Figma intake
Reference URL/page/node/version, measured versus inferred values, frame-to-component map, token table, typography, assets/licenses, breakpoints/content flow and missing states. Respect the project's access route.

## Architecture and contracts
Component/server boundaries, types/request/response/errors, data ownership, authorization, cache model, mutation/retry/idempotency and failure behavior. Decision/alternatives/tradeoffs; link ADR when consequential.

## States and accessibility
Initial/loading/empty/partial/success/error/disabled/focus; semantic/keyboard/focus/error announcement behavior, reduced motion and target criteria.

## Motion spec (N/A unless applicable)
Item ID, target/hook, trigger, from/to, duration/easing/stagger, cancel/replay, touch/focus, reduced-motion and JS-failure fallback.

## Dependencies and technology decisions
Existing/native alternatives first; justified package/version compatibility/license/bundle cost. One dependency owner. No assumed infrastructure.

## Performance, SEO and verification
Project budgets and baseline conditions, appropriate metadata/assets and exact evidence requirements. No lab-to-field claims.

## Operational notes
Config NAMES/public-server scope, rollout/rollback, observability/redaction, risks and explicit unknowns. No credentials.
