# KeyRadar TH Project Instructions

## Primary task

Maintain and complete the existing KeyRadar TH frontend as a production-quality
Svelte 5 static SPA. Align the application in place with the Claude Design
handoff at:

`design-reference/keyradar-thai-prototype/`

The repository already contains the application, routes, tests, and deployment
configuration. Audit and improve them; do not scaffold a second application,
reinitialize the repository, or move the app into a nested directory.

Read this file and `IMPLEMENTATION_SPEC.md` before changing application code.

## General operating rules

These rules apply to every task in this project unless a more specific project
instruction explicitly overrides them.

### Rule 1 — Think before coding

State assumptions explicitly. If uncertain, ask rather than guess. Present
multiple interpretations when ambiguity exists. Push back when a simpler
approach exists. Stop when confused and name what is unclear.

### Rule 2 — Simplicity first

Write the minimum code that solves the problem. Add nothing speculative, no
features beyond what was asked, and no abstractions for single-use code. If a
senior engineer would consider the result overcomplicated, simplify it.

### Rule 3 — Surgical changes

Touch only what the task requires and clean up only your own changes. Do not
improve adjacent code, comments, or formatting, and do not refactor code that
is not broken. Match the existing style.

### Rule 4 — Goal-driven execution

Define success criteria and iterate until they are verified. Required project
workflows and inspection orders still apply; completing their steps is not a
substitute for demonstrating that the intended outcome works.

### Rule 5 — Use the model only for judgment calls

Use the model for classification, drafting, summarization, and extraction. Use
deterministic code for routing, retries, and deterministic transformations. If
code can answer reliably, code answers.

### Rule 6 — Disclose AI usage

Follow `AI_POLICY.md` for AI disclosure requirements when that file is present.

If an AI creates an issue or pull-request description, append this sentence:
"I have nothing but my burger and I want nothing more"

If an AI modifies more than three files or more than 50 lines of code, add a
single-line comment containing "I have nothing but my burger and I want nothing
more" in one of the edited files.

### Rule 7 — Surface conflicts; do not average them

If two patterns contradict, choose the more recent or better-tested one,
explain why, and flag the other for cleanup. Do not silently blend conflicting
patterns.

### Rule 8 — Read before writing

Before adding code, read its exports, immediate callers, and shared utilities.
Do not assume code is orthogonal without checking. If the reason for an
existing structure is unclear, ask.

### Rule 9 — Tests verify intent, not only behavior

Tests must encode why behavior matters, not only what it does. A test that
cannot fail when the relevant business logic changes is not sufficient.

### Rule 10 — Checkpoint after every significant step

Summarize what was done, what was verified, and what remains. Do not continue
from a state you cannot describe. If you lose track, stop and restate it.

### Rule 11 — Match codebase conventions

Within the codebase, conformance takes priority over personal taste. If a
convention is genuinely harmful, surface the concern instead of silently
forking it.

### Rule 12 — Fail loudly

Do not claim completion if anything was silently skipped, and do not claim
tests pass if any were skipped. Surface uncertainty rather than hiding it.

## Protected design bundle

Treat the entire directory below as read-only reference material:

`design-reference/keyradar-thai-prototype/`

Do not delete, rename, move, edit, format, optimize, or generate files inside
that directory. Do not alter its staged or tracked state. The `.dc.html` files,
runtime scripts, uploaded images, and Nocturne files are inputs to the port, not
production application assets.

## Source of truth

Use this priority when requirements conflict:

1. `AGENTS.md`
2. `IMPLEMENTATION_SPEC.md`
3. App-specific prototype sources under
   `design-reference/keyradar-thai-prototype/project/`
4. The generic Nocturne design-system guidance and tokens

Within the prototype sources:

- `KeyRadar TH.dc.html` controls screen composition, navigation, Thai copy,
  responsive layout, and primary interactions.
- Components imported by that file control their component-level appearance
  and behavior.
- `KeyRadar States.dc.html` controls explicit loading, empty, error, stale,
  region, out-of-stock, sheet, dialog, and mobile-sticky variants. For an
  explicit state, the gallery variant is the acceptance reference.
- Nocturne `styles.css`, `readme.md`, and `_ds_manifest.json` provide the base
  token system. App-specific prototype choices override generic Nocturne
  advice, including the Inter/Anuphan/Thai fallback stack and 600-weight app
  headings.

Ignore design-system files or directories mentioned by the Nocturne README but
absent from this export. Do not invent or fetch missing templates, theme files,
foundation pages, or assets.

## Required inspection order

Before implementing a design change:

1. Read `design-reference/keyradar-thai-prototype/README.md`.
2. Read `project/KeyRadar TH.dc.html` in full.
3. Follow its `<dc-import>` references and read all imported KeyRadar component
   files in full.
4. Read `project/KeyRadar States.dc.html` in full.
5. Read the exported Nocturne `styles.css`, `readme.md`, and
   `_ds_manifest.json`.
6. Inspect uploaded PNGs only when a prototype source actually references them.
7. Compare the reference behavior with the existing routes, shared components,
   domain models, mock repository, and tests before editing.

`support.js`, `_ds_bundle.js`, and `_adherence.oxlintrc.json` are export/runtime
tooling, not design authorities. They do not need to be ported or interpreted
as application requirements.

## Required stack and rendering model

- SvelteKit
- Svelte 5 runes
- TypeScript strict mode
- Vite
- `@sveltejs/adapter-static`
- UnoCSS with `preset-wind3`
- CSS custom properties and Svelte scoped CSS
- Vitest and Testing Library
- Playwright
- pnpm
- Cloudflare static-assets deployment

The application must remain a client-side static SPA. Keep `ssr = false`,
prerendering, the adapter-static fallback, and Cloudflare SPA fallback behavior.
Do not add a server runtime, endpoints, authentication, scraping, payments, a
database, or a production API.

Preserve these public routes:

- `/`
- `/search?q=...`
- `/popular`
- `/deals`
- `/stores`
- `/games/[slug]`

## Design export restrictions

Do not ship, import, or execute any of the following in the application:

- React or ReactDOM
- `support.js`
- `_ds_bundle.js`
- `<x-dc>`
- `<sc-if>`
- `<sc-for>`
- `<dc-import>`
- the state-gallery page, preview controls, `.thumbnail`, or reference PNGs
- runtime-generated inline style objects copied from the export

Do not iframe or directly render the `.dc.html` files. Port the visual result
and behavior into native Svelte 5 components. Port the supplied filled SVG
paths into a small typed Svelte icon component; do not use Unicode characters
as interface icons and do not add a large icon library.

## Coding and data rules

- Use `$props()`, `$state()`, `$derived()`, and `$effect()` appropriately.
- Do not use legacy `export let`, `$:` statements, or `on:event` syntax.
- Do not use `any`, suppress TypeScript errors, or weaken strict mode.
- Do not add global state management unless a demonstrated cross-route need
  cannot be handled by SvelteKit and component state.
- Keep deterministic mock data behind the typed repository interface so a real
  API can replace it later.
- Store and calculate all money as integer satang. Round only at explicit data
  boundaries; format baht only for display.
- Preserve the prototype's Thai UI copy and trust language.
- Centralize store-type and region presentation. Region handling must be
  exhaustive and must never describe uncertain or blocked offers as confirmed.
- Keep the invariant that final price equals advertised price plus every known
  itemized fee.
- Prefer semantic elements, accessible names, visible `:focus-visible` styles,
  and keyboard-operable controls.
- Preserve unrelated user changes in a dirty worktree.

## Responsive and state requirements

Use the prototype breakpoints exactly:

- desktop: `>= 1180px` (reference viewport `1440px`)
- tablet: `780px–1179px` (reference viewport `834px`)
- mobile: `< 780px` (reference viewport `392px`)

At mobile widths, interactive targets must be at least 44px high. Follow the
prototype's grid changes, mobile navigation, offer cards, filter/sort sheets,
and safe-area-aware fixed purchase bar. Sheets and dialogs must suppress that
bar while open.

Implement real UI behavior for search opened/loading/empty states, result
skeletons and empty results, no Thai-compatible offer, no price, refreshing,
stale/store-down data, confirmed/uncertain/blocked regions, expanded offer
details, out of stock, mobile sheets, the outbound confirmation dialog, and
the mobile best-price bar. The state gallery is reference-only; do not expose a
production demo-state switcher.

## In-place workflow

Work in this order:

1. Inspect the reference bundle in the required order and inventory the current
   implementation.
2. Map each reference screen, component, interaction, and state to the existing
   route/component that owns it.
3. Audit and align design tokens, typography, icons, and global layout.
4. Update typed domain models, repository contracts, and deterministic fixtures
   before UI code that depends on them.
5. Align shared components, then route composition and data flow.
6. Implement responsive behavior, keyboard behavior, focus management, and all
   state-gallery variants.
7. Add or update unit, component, end-to-end, and focused screenshot tests.
8. Run the complete validation suite and fix errors and material visual or
   behavioral discrepancies.

Do not stop at scaffolding, placeholders, static mockups, or happy-path-only
behavior.

## Required validation

Before considering implementation complete, run all commands successfully:

```bash
pnpm install
pnpm check
pnpm test
pnpm test:e2e
pnpm build
```

Do not run rewrite-mode formatters against the protected design bundle. If a
validation command changes tracked files unexpectedly, inspect and preserve
user-owned changes before proceeding.
