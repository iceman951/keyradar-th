# KeyRadar TH — Svelte 5 Implementation Specification

This specification defines the required production behavior for the existing
KeyRadar TH frontend. Follow it unless it conflicts with `AGENTS.md`.

## 1. Product objective and scope

KeyRadar TH helps Thai users compare the lowest estimated final price for Steam
games and understand whether an offer can be activated in Thailand. It must be
a responsive, accessible, Thai-language Svelte 5 static SPA that closely
reproduces the supplied Claude Design prototype.

The application is frontend-only. Use realistic, deterministic local data
behind a typed repository. Do not implement live scraping, authentication,
payments, checkout, a database, a server API, or user accounts. KeyRadar TH
does not sell games; purchase actions lead to the external store only after a
confirmation dialog.

The production application must not contain the prototype state gallery,
viewport/demo toolbar, React/DC runtime, reference preview frames, or uploaded
reference screenshots.

## 2. Design contract

The protected source bundle is:

`design-reference/keyradar-thai-prototype/`

Use the inspection order and precedence in `AGENTS.md`. In particular:

- `project/KeyRadar TH.dc.html` and its imported KeyRadar components define the
  normal screens, Thai copy, layout, and interactions.
- `project/KeyRadar States.dc.html` defines edge-state acceptance behavior.
- The Nocturne export defines the base token vocabulary and dark visual system.
- App-specific prototype choices override generic Nocturne guidance. Use the
  Inter, Anuphan, `Noto Sans Thai`, system-ui fallback stack and the app's
  600-weight headings.

Retain the near-neutral dark ground, muted tonal surfaces, soft radii, compact
spacing, blurple accent, and separate semantic success, warning, and error
roles. Green is reserved for a confirmed positive fact or the confirmed best
offer. Warning represents uncertainty or stale information. Red represents a
known incompatibility or unavailable action.

Use CSS custom properties for shared tokens and scoped CSS for component
layout. Port the filled icon paths supplied in the prototype through one small,
typed Svelte icon component. Icons used only for decoration are hidden from
assistive technology; icon-only controls have Thai accessible names. Do not use
Unicode symbols as UI icons or install a broad icon package.

## 3. Application architecture and routes

Keep SvelteKit in client-only static mode:

- `src/routes/+layout.ts` exports `ssr = false` and `prerender = true`.
- `@sveltejs/adapter-static` produces the SPA fallback (`200.html`).
- Cloudflare serves `build/` with single-page-application fallback behavior.
- Dynamic game slugs are enumerated from deterministic fixture data for the
  static build.

Preserve the existing public routes and responsibilities:

| Route | Required screen |
| --- | --- |
| `/` | Hero search, popular-query links, highlighted deals, three-step explanation, and supported-store preview. |
| `/search?q=...` | Search heading/count, loading skeletons, complete filtering/sorting, result rows, and no-results state. The trimmed `q` parameter is the source of truth. |
| `/popular` | The same result experience seeded with all games and initially sorted by popularity. |
| `/deals` | Deal tabs, counts, responsive game-card grid, and no-deals recovery state. |
| `/stores` | Store-type explanation and store cards sorted by trust. |
| `/games/[slug]` | Game metadata, edition availability, best-price summary, offer comparison, price history, refresh states, outbound dialog, and mobile fixed purchase bar. Unknown slugs show the no-results recovery state. |

The shared header provides brand navigation, desktop links, header search, and
mobile navigation. The shared footer retains the prototype's product/trust
copy. The state-gallery and viewport controls are not routes or production UI.

## 4. Domain and repository contract

All currency values are integer satang. Display formatting is the only place
that converts to baht. The following public concepts are required:

```ts
export type StoreType = 'steam' | 'official' | 'reseller' | 'marketplace';
export type RegionStatus = 'confirmed' | 'uncertain' | 'blocked';
export type RegionCode =
  | 'global'
  | 'sea'
  | 'thailand'
  | 'eu'
  | 'row'
  | 'north-america';

export type EditionCategory =
  | 'standard'
  | 'deluxe'
  | 'complete'
  | 'dlc'
  | 'bundle';

export type OfferFeeKind = 'platform' | 'buyer-protection' | 'payment';

export interface OfferFee {
  kind: OfferFeeKind;
  label: string;
  amountSatang: number;
}

export type EmptyStateKind =
  | 'no-results'
  | 'no-th'
  | 'no-price'
  | 'no-deals'
  | 'store-down';
```

Each edition has an `EditionCategory`. `EditionAvailability` must identify the
edition and distinguish an available edition, with its confirmed in-stock Thai
minimum, from `no-thai-offer`, whose minimum is `null`. The UI must not invent a
minimum from uncertain, blocked, or out-of-stock offers.

Replace the single aggregate offer fee with `fees: OfferFee[]`. Every `Offer`
also carries its `editionName`, edition category, typed region code/status,
`sellerReviewCount` where applicable, `isHistoricalLow`, and a real HTTPS
`purchaseUrl`. Marketplace seller rating and review count remain optional for
other store types. Preserve this invariant for every fixture and derived value:

```ts
offer.finalSatang ===
  offer.advertisedSatang +
  offer.fees.reduce((sum, fee) => sum + fee.amountSatang, 0);
```

`GameFilters` contains the existing Thailand-only, official-only,
marketplace-exclusion, in-stock, historical-low, maximum-price, and
minimum-discount filters plus:

```ts
steamOnly: boolean;
noAdditionalFeeOnly: boolean;
editionCategory: EditionCategory | 'all';
```

Official-only admits Steam and authorized official stores; Steam-only admits
only Steam. No-additional-fee admits only offers with an empty `fees` array.

Offer repository reads return an `OfferSnapshot` with exactly one game/edition
scope and these semantics:

```ts
export interface OfferSnapshot {
  gameSlug: string;
  editionKey: string;
  offers: Offer[];
  fetchedAt: Date;
  failedStores: string[];
  stale: boolean;
}
```

The repository exposes edition availability for a game and offer snapshots for
a selected edition. Result pages obtain candidates for every relevant edition,
apply all active filters to the complete candidate set, and only then select
the one displayed offer per game. Never select a best offer first and filter
that single row afterward.

The game page is driven by a discriminated `OfferLoadState` using `status`:

- `loading`: no snapshot exists yet.
- `ready`: a current snapshot is available.
- `refreshing`: retain and display the prior snapshot while fetching.
- `stale`: retain the prior snapshot after a partial or failed refresh and
  expose the failed stores/reason.
- `error`: no usable snapshot exists and retry is available.

Refresh must transition from a rendered snapshot to `refreshing`, never clear
the existing rows, and end in `ready` or `stale`. Initial failure with no cached
data ends in `error`.

Use one exhaustive region-presentation mapping for label, activation text,
explanation, and visual tone:

| Region | Status | Required meaning |
| --- | --- | --- |
| Global | confirmed | Usable in Thailand. |
| SEA | confirmed | Southeast Asia includes Thailand. |
| Thailand | confirmed | Thai store/key. |
| EU | uncertain | May not activate in Thailand; verify first. |
| ROW | uncertain | Supported-country list is incomplete; verify first. |
| North America | blocked | Cannot activate from Thailand. |

Use one centralized store-type presentation mapping. Store lists are ordered by
trust: Steam first; official stores alphabetically; resellers alphabetically;
marketplaces alphabetically.

Fixtures must be deterministic across runs and include every region/status,
multiple itemized fees, fee-free offers, marketplace seller metrics,
historical-low and ordinary prices, in-stock and out-of-stock offers, partial
store failures, and stale snapshots. They must not require network access.

## 5. Shared interaction behavior

### Search

Header and hero search instances own independent focus/open state. Focusing one
must not style or open the other. Search behavior is:

- Typing opens autocomplete and shows a loading skeleton until results resolve.
- Results show cover, title, year, confirmed-Thai status where true, and the
  lowest eligible final price.
- No matches show the prototype's empty-autocomplete message.
- A clear control appears only for non-empty input, clears without submitting,
  and returns focus to the input.
- Enter submits a non-empty trimmed query to `/search?q=...`; an empty query does
  nothing.
- Escape closes autocomplete without submitting. Arrow keys move through
  options and Enter selects the highlighted option.
- The listbox, options, highlighted state, and input relationship use correct
  ARIA attributes.

The mobile hero uses the shorter placeholder/button copy from the prototype.
Autocomplete must layer over subsequent content, and neither the hero nor page
containers may clip it.

### Results, filters, and sorting

Initial result filters show confirmed-Thai and in-stock offers, with no maximum
below ฿2,400, no minimum discount, and the prototype's initial edition choice.
All visible controls must affect results:

- maximum price: ฿99–฿2,400 in ฿50 steps;
- minimum discount: 0–80% in 5% steps;
- Thailand only, official only, Steam only, exclude marketplace, in stock,
  historical low, and no additional fee;
- Standard, Deluxe, Complete, DLC, and Bundle edition chips;
- price, discount, popularity, release date, and last-updated sorting.

Edition chips are single-select. Selecting the active chip again clears the
edition constraint to `all`. Active filters appear as removable pills,
including range, fee, and edition filters; each pill clears only itself. “Clear
all” removes optional constraints while retaining the safe in-stock default.

Filtering evaluates all candidate offers and removes a game only when none
remain. The displayed result row names the selected edition and store. Sort is
applied after selection. Price sorting uses final satang; discount compares the
selected offer with that edition's Steam price; updated sorting uses the
selected offer's freshness.

Desktop uses the sticky filter panel and select control. Mobile uses full-width
filter and sort bottom sheets. Filter changes update the sheet result count;
reset restores the defined clear state; Apply closes and retains changes.
Backdrop click, close, and Escape dismiss the sheet without losing changes.

### Deals and stores

Every deal tab is functional: featured, historical low, ending soon, under
฿200, under ฿500, at least 70% off, and Thailand-compatible. Counts and cards
reflect the active tab. A zero-result tab uses `no-deals` and returns to
featured. Store cards and preview chips use trust order and centralized labels.

## 6. Game pricing behavior

For each edition, calculate its minimum from confirmed, in-stock Thai-compatible
offers for that edition. Show the actual formatted minimum or the exact no-Thai
availability message; never estimate it as a percentage of Steam price.
Selecting an edition resets expanded rows and loads that edition's snapshot.

The best-price summary and green best styling are allowed only for the lowest
confirmed, in-stock eligible offer. Uncertain offers use warning language;
blocked offers use red incompatibility language. Neither can be marked best.
Non-best final prices remain neutral even if discounted.

The pricing area handles these states:

- Initial `loading`: stable skeletons, not a blank page.
- Successful empty snapshot: `no-price` with retry.
- Offers exist but none are confirmed for Thailand: `no-th` with an action to
  reveal all offers with their warnings.
- `refreshing`: keep all previous prices visible and show the refresh banner.
- Partial failures/current stale data: keep usable rows, identify stale status
  and failed stores, and show the `store-down` warning/retry treatment.
- No usable snapshot after failure: error/no-price recovery treatment.

Offer tables on desktop and cards on mobile show store identity/type, edition,
DRM, region and activation status, advertised price, summed known fees, final
price, discount, freshness, and stock. Expanded details show each fee by label,
the final-price equation, savings from that edition's Steam price, store trust
information, marketplace seller rating/review count, payment methods, and store
notes. Out-of-stock offers replace the purchase action with an explicit
“สินค้าหมด” status rather than a disabled purchase button.

Price history supports 30 days, 3 months, 6 months, 1 year, and all data. The
chart remains SVG-based, provides hover/focus values, distinguishes Steam price,
and updates the current, period-low, average, and Steam statistics for the
selected range.

## 7. External purchase confirmation

Every eligible purchase action opens a modal before navigating. The dialog
shows store, game and edition, advertised price, each known fee, final price,
store type, and region/DRM. Its warning is status-specific: confirmed still
requires rechecking the store, uncertain states that Thai activation is not
confirmed, and blocked states that activation from Thailand is known to fail.

The continue action uses the offer's real HTTPS `purchaseUrl` and opens it with
safe external-link behavior (`noopener`/`noreferrer`). Cancel, backdrop click,
and Escape close without navigation. The dialog has `role="dialog"`, an
accessible title and description, locks background scrolling, traps Tab and
Shift+Tab, focuses an appropriate action on open, and restores focus to the
originating control on close.

On mobile, the best-price bar is fixed to the viewport bottom and includes the
confirmed best final price, store, Steam comparison price, and purchase action.
Account for `env(safe-area-inset-bottom)` and reserve content space so the bar
does not obscure the page. Hide it when no confirmed best offer exists and
whenever a filter/sort sheet or purchase dialog is open.

## 8. Responsive and accessibility requirements

Use three layout modes from the prototype:

- Desktop (`>=1180px`, validate at 1440px): full navigation, four-column game
  grids, desktop result rows/table, and side-by-side game summary.
- Tablet (`780px–1179px`, validate at 834px): three/two-column grids as shown,
  wrapped metadata, and single-column game summary where required.
- Mobile (`<780px`, validate at 392px): mobile navigation, two-column game-card
  grids, one-column stores, offer cards instead of the table, bottom sheets,
  and the fixed purchase bar.

Requirements at every width:

- No unintended horizontal scrolling or clipped autocomplete/sheets/dialogs.
- Mobile interactive targets are at least 44px high.
- Native buttons, links, inputs, selects, and headings retain semantic roles.
- Every control is keyboard reachable and has a visible themed
  `:focus-visible` outline.
- Status is communicated by text/icon as well as color.
- Form controls have associated labels; live loading/result counts are
  announced without excessive interruption.
- Decorative graphics are hidden from assistive technology; meaningful covers
  and charts have useful accessible text.
- Motion respects `prefers-reduced-motion`.

## 9. Test and acceptance requirements

Unit tests must cover:

- the final-price/fee invariant and satang formatting;
- best-offer selection and exclusion of uncertain, blocked, and out-of-stock
  offers;
- every filter, filter-before-selection behavior, and every sort;
- trust ordering and exhaustive store/region presentation;
- edition availability, historical-low data, deterministic fixtures, snapshot
  failure/stale semantics, and load-state transitions.

Component tests must cover:

- autocomplete opened, loading, results, empty, clear, Enter, and Escape;
- all exported `EmptyStateKind` variants;
- desktop result/offer rows and mobile offer cards for best, ordinary,
  uncertain, blocked, expanded, and out-of-stock variants;
- loading, refreshing-with-retained-data, stale/store-down, no-price, and no-Thai
  pricing states;
- mobile filter/sort sheets, active pills, reset/apply behavior;
- dialog summary/warning variants, focus trap, Escape/backdrop close, focus
  restoration, and external URL attributes;
- mobile fixed bar visibility and suppression behind overlays.

Playwright tests run at 1440px, 834px, and 392px and cover navigation, hero and
header search, search results, all filter/sort/edition controls, deal tabs,
edition switching, refresh/stale behavior, blocked and out-of-stock offers,
outbound confirmation, and the fixed mobile purchase action. Add focused Svelte
screenshot baselines for material reference components/screens; never render or
snapshot the `.dc.html` files themselves.

Implementation is complete only when the reference bundle is unchanged and all
commands pass:

```bash
pnpm install
pnpm check
pnpm test
pnpm test:e2e
pnpm build
```
