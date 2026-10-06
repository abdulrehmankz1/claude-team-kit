# Next.js / React / TypeScript specialist reference

Activate only for a detected Next.js project. Any versions in the project profile are claims until measured. Verify package.json, lockfile, installed package metadata, tsconfig and next.config in the actual app before using version-specific APIs. Do not assume latest docs match the installed release.

## Rendering and boundaries
Identify App versus Pages Router and deployment/runtime constraints. For App Router, keep pages and data-heavy structure on the server when appropriate; introduce Client Components at the smallest useful interaction boundary. Do not mark an entire page client merely for one animation. A client boundary includes its imports: prevent server-only modules, tokens and unnecessary private fields from entering the bundle or serialized payload.

Pass intentional serializable view models to clients. Fetch server data close to its consumer without serial waterfalls; inspect Suspense placement and fallback behavior. Handle loading, error and not-found deliberately. Diagnose streaming/cache behavior in the installed version and config, not by folklore.

## Data, caching and mutation
Pick an existing API, Server Action or Route Handler according to consumers, security, deployment and failure needs. A Server Action is a callable server boundary requiring input validation and authorization, not a private function secured by its placement. Fetch user/tenant identity server-side and recheck permission at the operation; hiding UI does not authorize anything.

Determine whether Cache Components or the earlier caching model is active. Document cache keys, scope, lifetime and invalidation, including ownership boundaries. Never put user-specific responses in a shared cache accidentally. Align mutation feedback, refresh/revalidation and optimistic updates with the actual API. Avoid unsupported combinations copied from another Next version.

Do not blanket-disable caching to repair an isolated correctness issue; identify its source. Do not cache everything to chase a score. For public portfolios, static content may be simplest; contact integrations still require real error handling and server secrets.

## React and type discipline
Use strict types and discriminated unions where they clarify states. Validate untrusted JSON rather than casting it. Avoid unexplained any, assertions, disabled lints and non-null claims. Keep pure render logic stable; diagnose invalid nesting, time/random values, locale/timezone output, browser-only globals and unstable keys when hydration differs.

Use effects to synchronize external systems, with cleanup, not to mirror derived state. In Strict Mode, setup/cleanup must be repeatable. Avoid stale closure bugs, racing requests and animation listeners surviving navigation. Use installed React form/transition APIs only after checking semantics; a transition does not supply mutation authorization or idempotency.

## Assets, routing and metadata
Use existing route conventions and Link behavior; handle selected, not-found and detail routes. Verify async params/searchParams/cookies/headers conventions for the installed version. Check generated route types before relying on PageProps/LayoutProps globals; do not manually edit generated next-env files.

Use next/image where appropriate with dimensions, responsive sizes, actual crop, alt text and justified preload/loading. Use next/font or the approved font-loading approach and verify font licensing. Metadata, canonical links, robots/sitemap, social images and structured data must reflect real content and approved publication behavior; do not fabricate schemas or claims.

Tailwind 4 may use CSS-first @theme configuration; inspect actual setup. Do not add a legacy config by habit. For icon libraries versus exported SVG, favor the approved artwork and existing project conventions.

## Verification
Run the actual lint, local typecheck, tests and build commands after inspecting scripts. Next build is not a substitute for a separate type/lint check when the project skips them. Respect Yarn and the installed tsc binary; do not use npx that may silently download another tool.

Inspect browser console/network, direct entry/refresh, client navigation, hydration, loading/error states, forms and reference viewports. Measure production mode where a performance claim depends on it. Include the app snapshot and tested environment. If the app isn't included or browser tools are missing, report these checks NOT RUN rather than verified.

Official starting points (select the correct version):
- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://nextjs.org/docs/app/guides/data-security
- https://nextjs.org/docs/app/getting-started/caching
- https://nextjs.org/docs/app/guides/caching-without-cache-components
- https://react.dev/reference/react
- https://www.typescriptlang.org/docs/
