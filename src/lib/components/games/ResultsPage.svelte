<script lang="ts">
  import { goto } from '$app/navigation';
  import { tick } from 'svelte';
  import { page } from '$app/state';
  import type { Game, GameFilters, Offer, Store } from '$lib/domain/models';
  import { gameRepository } from '$lib/data/mock-repository';
  import { DEFAULT_GAME_FILTERS, selectDisplayedOffer } from '$lib/domain/filters';
  import { sortGameOfferResults, type ResultSortKey } from '$lib/domain/results';
  import FilterPanel from '$lib/components/filters/FilterPanel.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import ResultRow from './ResultRow.svelte';

  type Candidate = { game: Game; offers: Offer[] };
  type Entry = { game: Game; offer: Offer; store: Store };

  let { popular = false }: { popular?: boolean } = $props();
  let candidates = $state<Candidate[]>([]);
  let stores = $state<Store[]>([]);
  let loading = $state(true);
  let sort = $state<ResultSortKey>('final');
  let sheet = $state<'filter' | 'sort' | null>(null);
  let filters = $state<GameFilters>({ ...DEFAULT_GAME_FILTERS });
  let draftFilters = $state<GameFilters>({ ...DEFAULT_GAME_FILTERS });
  let requestId = 0;
  let sheetElement = $state<HTMLDivElement>();
  let sheetTrigger: HTMLElement | null = null;

  const query = $derived(popular ? '*' : (page.url.searchParams.get('q') ?? 'The Forest'));

  const clearFilters = (): GameFilters => ({
    ...DEFAULT_GAME_FILTERS,
    thailandOnly: false,
    steamOnly: false,
    officialOnly: false,
    excludeMarketplace: false,
    inStockOnly: false,
    historicalLowOnly: false,
    noAdditionalFeeOnly: false,
    editionCategory: 'all'
  });

  const buildEntries = (activeFilters: GameFilters): Entry[] => candidates.flatMap(({ game, offers }) => {
    const offer = selectDisplayedOffer(offers, stores, activeFilters);
    const store = offer ? stores.find((item) => item.id === offer.storeId) : undefined;
    return offer && store ? [{ game, offer, store }] : [];
  });

  const shown = $derived(sortGameOfferResults(buildEntries(filters), sort));
  const draftCount = $derived(buildEntries(draftFilters).length);
  const filterCount = $derived([
    filters.thailandOnly,
    filters.steamOnly,
    filters.officialOnly,
    filters.excludeMarketplace,
    filters.inStockOnly,
    filters.historicalLowOnly,
    filters.noAdditionalFeeOnly,
    filters.minDiscountPercent > 0,
    filters.maxPriceSatang < 240_000,
    filters.editionCategory !== 'all'
  ].filter(Boolean).length);

  const sortOptions: readonly [ResultSortKey, string][] = [
    ['final', 'ราคาต่ำสุด'],
    ['discount', 'ส่วนลดมากที่สุด'],
    ['popular', 'ความนิยม'],
    ['release', 'วันวางจำหน่าย'],
    ['updated', 'อัปเดตล่าสุด']
  ];
  const sortLabel = $derived(sortOptions.find(([key]) => key === sort)?.[1] ?? 'ราคาต่ำสุด');
  const editionLabel = $derived({ standard: 'Standard', deluxe: 'Deluxe', complete: 'Complete', dlc: 'DLC', bundle: 'Bundle' }[filters.editionCategory as Exclude<GameFilters['editionCategory'], 'all'>]);

  $effect(() => {
    const currentQuery = query;
    const currentRequest = ++requestId;
    loading = true;
    Promise.all([
      currentQuery === '*' ? gameRepository.listGames() : gameRepository.searchGames(currentQuery),
      gameRepository.listStores()
    ]).then(async ([games, availableStores]) => {
      const built = await Promise.all(games.map(async (game): Promise<Candidate> => {
        const snapshots = await Promise.all(game.editions.map((edition) => gameRepository.getOffers(game.slug, edition.key)));
        return { game, offers: snapshots.flatMap((snapshot) => snapshot.offers) };
      }));
      if (currentRequest === requestId) {
        stores = availableStores;
        candidates = built;
        loading = false;
      }
    }).catch(() => {
      if (currentRequest === requestId) {
        candidates = [];
        loading = false;
      }
    });
  });

  $effect(() => { if (popular && sort === 'final') sort = 'popular'; });

  $effect(() => {
    if (!sheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  });

  const reset = () => { filters = clearFilters(); };
  const focusSheet = async () => {
    await tick();
    sheetElement?.querySelector<HTMLElement>('button')?.focus();
  };
  const openFilters = (trigger: HTMLElement) => {
    sheetTrigger = trigger;
    draftFilters = { ...filters };
    sheet = 'filter';
    void focusSheet();
  };
  const openSort = (trigger: HTMLElement) => {
    sheetTrigger = trigger;
    sheet = 'sort';
    void focusSheet();
  };
  const resetDraft = () => { draftFilters = clearFilters(); };
  const closeSheet = () => {
    const trigger = sheetTrigger;
    sheet = null;
    sheetTrigger = null;
    void tick().then(() => trigger?.focus());
  };
  const applyDraft = () => { filters = { ...draftFilters }; closeSheet(); };
  const selectSort = (value: ResultSortKey) => { sort = value; closeSheet(); };
  const keydown = (event: KeyboardEvent) => {
    if (!sheet) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSheet();
      return;
    }
    if (event.key !== 'Tab' || !sheetElement) return;
    const focusable = Array.from(sheetElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
</script>

<svelte:window onkeydown={keydown} />

<main class="page">
  <header class="intro"><div><h1>{popular ? 'เกมยอดนิยม' : `ผลการค้นหา “${query}”`} <small>{loading ? 'กำลังค้นหา…' : `พบ ${shown.length} เกม`}</small></h1><p>ราคาที่แสดงคือราคาสุทธิโดยประมาณต่ำสุดที่ตรงกับตัวกรอง · อัปเดตล่าสุดจากร้านค้าที่รองรับ</p></div></header>
  <div class="layout">
    <aside><FilterPanel bind:filters onreset={reset} /></aside>
    <section class="results" aria-busy={loading}>
      <div class="controls">
        <div class="mobile-buttons"><button class="btn" type="button" onclick={(event) => openFilters(event.currentTarget)}><Icon name="sliders" size={15} />ตัวกรอง {#if filterCount}<b>{filterCount}</b>{/if}</button><button class="btn" type="button" onclick={(event) => openSort(event.currentTarget)}><Icon name="sort" size={15} />{sortLabel}</button></div>
        <span class="count">{shown.length} เกม</span>
        <label>เรียงตาม <select bind:value={sort}>{#each sortOptions as option}<option value={option[0]}>{option[1]}</option>{/each}</select></label>
      </div>

      {#if filterCount}
        <div class="pills" aria-label="ตัวกรองที่ใช้งานอยู่">
          {#if filters.thailandOnly}<button type="button" onclick={() => { filters = { ...filters, thailandOnly: false }; }}>ใช้งานได้ในประเทศไทย <Icon name="x" size={11} /></button>{/if}
          {#if filters.steamOnly}<button type="button" onclick={() => { filters = { ...filters, steamOnly: false }; }}>เปิดใช้งานผ่าน Steam <Icon name="x" size={11} /></button>{/if}
          {#if filters.officialOnly}<button type="button" onclick={() => { filters = { ...filters, officialOnly: false }; }}>ร้านค้าอย่างเป็นทางการ <Icon name="x" size={11} /></button>{/if}
          {#if filters.excludeMarketplace}<button type="button" onclick={() => { filters = { ...filters, excludeMarketplace: false }; }}>ไม่รวม Marketplace <Icon name="x" size={11} /></button>{/if}
          {#if filters.inStockOnly}<button type="button" onclick={() => { filters = { ...filters, inStockOnly: false }; }}>มีสินค้าพร้อมส่ง <Icon name="x" size={11} /></button>{/if}
          {#if filters.historicalLowOnly}<button type="button" onclick={() => { filters = { ...filters, historicalLowOnly: false }; }}>ต่ำสุดเป็นประวัติการณ์ <Icon name="x" size={11} /></button>{/if}
          {#if filters.noAdditionalFeeOnly}<button type="button" onclick={() => { filters = { ...filters, noAdditionalFeeOnly: false }; }}>ไม่มีค่าธรรมเนียมเพิ่ม <Icon name="x" size={11} /></button>{/if}
          {#if filters.minDiscountPercent}<button type="button" onclick={() => { filters = { ...filters, minDiscountPercent: 0 }; }}>ลดตั้งแต่ {filters.minDiscountPercent}% <Icon name="x" size={11} /></button>{/if}
          {#if filters.maxPriceSatang < 240_000}<button type="button" onclick={() => { filters = { ...filters, maxPriceSatang: 240_000 }; }}>ไม่เกิน ฿{Math.round(filters.maxPriceSatang / 100).toLocaleString('th-TH')} <Icon name="x" size={11} /></button>{/if}
          {#if filters.editionCategory !== 'all'}<button type="button" onclick={() => { filters = { ...filters, editionCategory: 'all' }; }}>Edition: {editionLabel} <Icon name="x" size={11} /></button>{/if}
          <button class="clear-all" type="button" onclick={reset}>ล้างทั้งหมด</button>
        </div>
      {/if}

      {#if loading}
        <div class="skeletons" aria-label="กำลังโหลดผลการค้นหา">{#each [1, 2, 3, 4] as item}<div aria-hidden="true" style={`animation-delay:${item * .08}s`}></div>{/each}</div>
      {:else if !shown.length}
        <EmptyState kind="no-results" query={query === '*' ? 'ตัวกรองที่เลือก' : query} action={candidates.length ? reset : () => void goto('/')} />
      {:else}
        <div class="rows">{#each shown as entry (entry.game.slug)}<ResultRow {...entry} />{/each}</div>
      {/if}
    </section>
  </div>
</main>

{#if sheet}
  <div class="backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) closeSheet(); }}>
    <div bind:this={sheetElement} class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">
      <i aria-hidden="true"></i>
      <header><h2 id="sheet-title">{sheet === 'filter' ? 'ตัวกรอง' : 'เรียงตาม'}</h2><button type="button" aria-label="ปิด" onclick={closeSheet}><Icon name="x" size={18} /></button></header>
      {#if sheet === 'filter'}
        <div class="sheet-tools"><button type="button" onclick={resetDraft}>ล้างทั้งหมด</button></div>
        <div class="sheet-body"><FilterPanel bind:filters={draftFilters} bare onreset={resetDraft} /></div>
        <div class="sheet-foot"><button class="apply" type="button" onclick={applyDraft}>ดูผลลัพธ์ {draftCount} เกม</button></div>
      {:else}
        <div class="sorts">{#each sortOptions as option}<button type="button" class:active={sort === option[0]} onclick={() => selectSort(option[0])}>{option[1]} {#if sort === option[0]}<Icon name="check" size={17} />{/if}</button>{/each}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .intro h1{font-size:27px}.intro h1 small{margin-left:8px;color:var(--mute);font-size:13px;font-weight:400}.intro p{margin:5px 0 20px;color:var(--mute2);font-size:12.5px}
  .layout{display:flex;align-items:flex-start;gap:22px}.layout>aside{position:sticky;top:82px;width:246px;flex:none}.results{min-width:0;flex:1}
  .controls{display:flex;align-items:center;gap:10px;margin-bottom:14px}.count{margin-right:auto;color:var(--mute2);font-size:12px}.controls label{display:flex;align-items:center;gap:8px;color:var(--mute);font-size:12.5px}.controls select{min-height:36px;padding:0 30px 0 10px;border:1px solid var(--line);border-radius:8px;background:var(--color-surface);color:var(--ink)}.mobile-buttons{display:none}
  .pills{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:14px}.pills button{display:inline-flex;align-items:center;gap:6px;min-height:28px;padding:4px 9px;border:1px solid color-mix(in srgb,var(--color-accent) 40%,transparent);border-radius:999px;background:color-mix(in srgb,var(--color-accent) 12%,transparent);color:var(--color-accent-300);font-size:11.5px;cursor:pointer}.pills .clear-all{border-color:transparent;background:transparent;color:var(--mute);text-decoration:underline}
  .rows,.skeletons{display:flex;flex-direction:column;gap:10px}.skeletons div{height:132px;border:1px solid var(--line2);border-radius:13px;background:linear-gradient(100deg,#1b1e2c 30%,#23273a 50%,#1b1e2c 70%);background-size:720px 100%;animation:shimmer 1.25s infinite}
  .backdrop{position:fixed;inset:0;z-index:70;display:none;align-items:flex-end;background:rgb(9 11 18 / 66%);backdrop-filter:blur(3px)}.sheet{width:100%;max-height:88dvh;overflow:auto;border:1px solid var(--line);border-radius:20px 20px 0 0;background:var(--raise);animation:rise .2s}.sheet>i{display:block;width:38px;height:4px;margin:10px auto;border-radius:99px;background:#3d4054}.sheet header{display:flex;align-items:center;justify-content:space-between;padding:4px 16px 12px;border-bottom:1px solid var(--line2)}.sheet header h2{font-size:16px}.sheet header button{width:44px;height:44px;display:grid;place-items:center;border:0;border-radius:10px;background:transparent;color:var(--mute);cursor:pointer}.sheet-tools{display:flex;justify-content:flex-end;padding:10px 16px 0}.sheet-tools button{border:0;background:transparent;color:var(--color-accent);font-size:12.5px}.sheet-body{padding:8px 16px 14px}.sheet-foot{position:sticky;bottom:0;padding:12px 16px calc(16px + env(safe-area-inset-bottom));border-top:1px solid var(--line2);background:var(--raise)}.apply{width:100%;height:48px;border:1px solid var(--color-accent);border-radius:12px;background:color-mix(in srgb,var(--color-accent) 14%,transparent);color:var(--color-accent-200);font-size:15px;font-weight:600}.sorts button{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:52px;padding:15px 18px;border:0;border-top:1px solid var(--line2);background:transparent;color:var(--ink);text-align:left}.sorts button.active{color:var(--color-accent-200)}
  @media(max-width:779px){.intro h1{font-size:21px}.layout>aside,.controls>.count,.controls>label{display:none}.mobile-buttons{display:flex;width:100%;gap:10px}.mobile-buttons button{min-height:44px;flex:1}.mobile-buttons b{min-width:17px;height:17px;display:grid;place-items:center;border-radius:99px;background:var(--color-accent);color:var(--color-bg);font-size:10px}.pills{overflow-x:auto;flex-wrap:nowrap;padding-bottom:3px}.pills button{min-height:36px;flex:none}.backdrop{display:flex}}
</style>
