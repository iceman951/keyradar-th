# KeyRadar TH — Svelte 5 Implementation Specification

This document is the authoritative implementation specification.

Codex must inspect every file under:

design-reference/claude-design/

before implementing the application.

The Claude Design export is a visual and behavioral reference only.
Do not ship its React/DC runtime in production.

Follow every requirement in this document unless it conflicts with an
explicit instruction in AGENTS.md.

## 1. Objective

Rebuild the KeyRadar TH website from the supplied Claude Design export as a
production-quality, responsive Svelte 5 application.

The website helps Thai users find and compare the lowest estimated final price
for Steam games that can be activated in Thailand.

This implementation is frontend-only and must use realistic local mock data.
Do not implement scraping, authentication, payments, a real database, or a
production API in this phase.

The finished project must:

- Closely reproduce the supplied design.
- Work at desktop, tablet, and mobile widths.
- Be fast when served as static assets through Cloudflare.
- Use Thai UI copy.
- Require no login or registration.
- Be structured so mock data can later be replaced by an API.

---

## 2. Source Files

Read all of these files before writing code:

- `KeyRadar TH.dc.html`
- `KeyRadar Autocomplete.dc.html`
- `KeyRadar Chart.dc.html`
- `KeyRadar Empty.dc.html`
- `KeyRadar Filters.dc.html`
- `KeyRadar Game Card.dc.html`
- `KeyRadar Offer Card.dc.html`
- `KeyRadar Result Row.dc.html`
- `KeyRadar Store Card.dc.html`
- `styles.css`
- `readme.md`
- `_ds_manifest.json`

Use these files as the source of truth for:

- Layout
- Thai copy
- Colors
- Typography
- Spacing
- Responsive behavior
- Component appearance
- Interactive states
- Mock-data semantics

The following files are export runtime files and must not be included in the
production application:

- `support.js`
- `_ds_bundle.js`
- `_adherence.oxlintrc.json`

Do not reuse or ship:

- React
- ReactDOM
- DCLogic
- `<x-dc>`
- `<sc-if>`
- `<sc-for>`
- `<dc-import>`
- Runtime-generated inline style objects

Port the design into native Svelte components.

---

## 3. Required Technology Stack

Use:

- SvelteKit
- Svelte 5
- TypeScript with strict mode
- `@sveltejs/adapter-static`
- UnoCSS with `preset-wind3`
- CSS custom properties
- Svelte scoped CSS for complex component styling
- Vite
- Vitest
- Playwright
- pnpm

Do not use:

- React
- Vue
- Tailwind component libraries
- Bootstrap
- DaisyUI
- Material UI
- Vuetify
- Skeleton UI
- Flowbite
- CSS-in-JS
- styled-components
- Emotion
- Chart.js
- ECharts
- A large icon library
- A global state-management library unless genuinely required

Use the SVG chart and inline SVG icons represented in the supplied design.

---

## 4. Rendering and Deployment Model

Build the application as a static client-side SPA.

Configure SvelteKit as follows:

### `src/routes/+layout.ts`

```ts
export const ssr = false;
export const prerender = true;