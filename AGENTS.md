# KeyRadar TH Project Instructions

## Primary task

Build the complete KeyRadar TH frontend from scratch as a Svelte 5
static SPA.

Read and follow:

- `IMPLEMENTATION_SPEC.md`
- Every file under `design-reference/claude-design/`

before creating implementation code.

## Source of truth

Priority order:

1. `AGENTS.md`
2. `IMPLEMENTATION_SPEC.md`
3. Claude Design files under `design-reference/claude-design/`

The Claude Design files define the intended visual appearance, layout,
Thai copy, responsive behavior, component states, and interactions.

## Required stack

- SvelteKit
- Svelte 5 runes
- TypeScript strict mode
- Vite
- `@sveltejs/adapter-static`
- UnoCSS with `preset-wind3`
- CSS custom properties
- Svelte scoped CSS
- Vitest
- Playwright
- pnpm

The application must be a static client-side SPA.

Do not implement SSR.

## Project initialization

The repository does not contain an application yet.

Create the complete SvelteKit project in the repository root.

Do not delete or modify files under:

`design-reference/claude-design/`

Create all required project files, including:

- `package.json`
- `pnpm-lock.yaml`
- `svelte.config.js`
- `vite.config.ts`
- `uno.config.ts`
- `tsconfig.json`
- SvelteKit routes
- components
- styles
- mock data
- unit tests
- Playwright tests
- Cloudflare static deployment configuration

Do not place the application inside an additional nested `web/` directory.

## Design export restrictions

Do not ship or import:

- React
- ReactDOM
- `support.js`
- `_ds_bundle.js`
- `<x-dc>`
- `<sc-if>`
- `<sc-for>`
- `<dc-import>`

Port the design into native Svelte 5 components.

Do not embed the Claude HTML files using an iframe.

Do not copy runtime-generated inline style objects directly into Svelte.

## Coding rules

- Use Svelte 5 runes.
- Use `$props()`, `$state()`, `$derived()`, and `$effect()` appropriately.
- Do not use legacy `export let`.
- Do not use legacy `$:` reactive statements.
- Do not use legacy `on:click` syntax.
- Do not use `any`.
- Do not suppress TypeScript errors.
- Do not add a global state library unless clearly necessary.
- Keep mock data behind a typed repository interface.
- Store monetary values as integer satang.
- Preserve Thai UI copy.
- Reuse design tokens from the supplied design system.

## Workflow

Work in this order:

1. Inspect all design-reference files.
2. Summarize the identified screens, components, and interactions.
3. Scaffold the SvelteKit project.
4. Port design tokens.
5. Define typed domain models.
6. Create consistent mock data.
7. Build shared components.
8. Build all routes.
9. Implement responsive behavior.
10. Add interactions and UI states.
11. Add tests.
12. Run validation and production build.
13. Fix all errors and visual discrepancies.

Do not stop after scaffolding or creating placeholder pages.

## Required validation

Before considering the implementation complete, run:

```bash
pnpm install
pnpm check
pnpm test
pnpm test:e2e
pnpm build