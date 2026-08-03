<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import type {
    EditionAvailability,
    Game,
    Offer,
    OfferLoadState,
    OfferSnapshot,
    PricePoint,
    RegionStatus,
    Store
  } from '$lib/domain/models';
  import { gameRepository } from '$lib/data/mock-repository';
  import { bestThaiOffer, offerFeeTotal } from '$lib/domain/pricing';
  import { storeTypeLabel } from '$lib/domain/presentation';
  import { formatBaht } from '$lib/utils/currency';
  import { formatRelativeMinutes } from '$lib/utils/date';
  import GameCover from '$lib/components/ui/GameCover.svelte';
  import StoreLogo from '$lib/components/ui/StoreLogo.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import OfferTable from '$lib/components/offers/OfferTable.svelte';
  import OfferCard from '$lib/components/offers/OfferCard.svelte';
  import ExitDialog from '$lib/components/offers/ExitDialog.svelte';
  import PriceChart from '$lib/components/chart/PriceChart.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';

  let game = $state<Game | null>(null);
  let stores = $state<Store[]>([]);
  let history = $state<PricePoint[]>([]);
  let editionAvailability = $state<EditionAvailability[]>([]);
  let editionSnapshots = $state<Record<string, OfferSnapshot>>({});
  let loadState = $state<OfferLoadState>({ status: 'loading' });
  let edition = $state('standard');
  let range = $state(92);
  let thaiOnly = $state(true);
  let dialogOffer = $state<Offer | null>(null);
  let expanded = $state<Record<string, boolean>>({});
  let requestSequence = 0;

  const slug = $derived(page.params.slug ?? '');
  const demo = $derived(page.url.searchParams.get('state') ?? '');

  const snapshot = $derived.by((): OfferSnapshot | null => {
    switch (loadState.status) {
      case 'ready':
      case 'refreshing':
      case 'stale':
        return loadState.snapshot;
      case 'error':
        return loadState.previousSnapshot ?? null;
      case 'loading':
        return null;
    }
  });

  const offers = $derived.by((): Offer[] => {
    const source = snapshot?.offers ?? [];
    if (demo === 'no-th' || demo === 'nothai' || demo === 'uncertain') {
      return source.filter((offer) => offer.regionStatus !== 'confirmed');
    }
    if (demo === 'oos' || demo === 'out-of-stock') {
      const firstConfirmed = source.find((offer) => offer.regionStatus === 'confirmed' && offer.inStock);
      return source.map((offer) => offer.id === firstConfirmed?.id ? { ...offer, inStock: false } : offer);
    }
    return source;
  });

  const visibleOffers = $derived(
    offers.filter((offer) => !thaiOnly || offer.regionStatus === 'confirmed')
  );
  const best = $derived(bestThaiOffer(offers));
  const bestStore = $derived(best ? stores.find((store) => store.id === best.storeId) : undefined);
  const selectedEdition = $derived(game?.editions.find((item) => item.key === edition));
  const steamPrice = $derived(selectedEdition?.steamPriceSatang ?? 0);
  const confirmedCount = $derived(
    offers.filter((offer) => offer.regionStatus === 'confirmed' && offer.inStock).length
  );
  const activationStatus = $derived.by((): RegionStatus => {
    if (confirmedCount > 0) return 'confirmed';
    if (offers.some((offer) => offer.regionStatus === 'uncertain')) return 'uncertain';
    return 'blocked';
  });
  const isNoPrice = $derived(
    demo === 'no-price' || demo === 'noprice' ||
    (loadState.status === 'error' && !loadState.previousSnapshot) ||
    (loadState.status !== 'loading' && offers.length === 0)
  );
  const isRefreshing = $derived(loadState.status === 'refreshing' || demo === 'refreshing');
  const isStoreDown = $derived(
    loadState.status === 'stale' || demo === 'store-down' || Boolean(snapshot?.failedStores.length)
  );
  const shouldShowSticky = $derived(Boolean(best && bestStore && !dialogOffer && !isNoPrice));
  const stats = $derived(
    history.length
      ? [
          Math.min(...history.map((point) => point.priceSatang)),
          Math.round(history.reduce((sum, point) => sum + point.priceSatang, 0) / history.length)
        ]
      : [0, 0]
  );

  const stateMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลราคาจากร้านค้าได้';

  const asReadyState = (next: OfferSnapshot): OfferLoadState =>
    next.stale || next.failedStores.length
      ? { status: 'stale', snapshot: next, message: 'ร้านค้าบางแห่งไม่ตอบสนอง ราคาบางรายการเป็นข้อมูลจากครั้งก่อน' }
      : { status: 'ready', snapshot: next };

  const loadGame = async (gameSlug: string) => {
    const request = ++requestSequence;
    loadState = { status: 'loading' };
    try {
      const [value, allStores] = await Promise.all([
        gameRepository.getGame(gameSlug),
        gameRepository.listStores()
      ]);
      if (request !== requestSequence) return;
      game = value ?? null;
      stores = allStores;
      if (!value) return;

      const firstEdition = value.editions[0]?.key ?? 'standard';
      edition = firstEdition;
      const [initialSnapshot, availability] = await Promise.all([
        gameRepository.getOffers(gameSlug, firstEdition),
        gameRepository.getEditionAvailability(gameSlug)
      ]);
      if (request !== requestSequence) return;
      editionSnapshots = { [firstEdition]: initialSnapshot };
      editionAvailability = availability;
      loadState = asReadyState(initialSnapshot);
    } catch (error) {
      if (request !== requestSequence) return;
      loadState = { status: 'error', message: stateMessage(error) };
    }
  };

  const selectEdition = async (key: string) => {
    if (!game || key === edition) return;
    edition = key;
    expanded = {};
    const cached = editionSnapshots[key];
    if (cached) {
      loadState = asReadyState(cached);
      return;
    }
    loadState = { status: 'loading' };
    try {
      const next = await gameRepository.getOffers(game.slug, key);
      editionSnapshots = { ...editionSnapshots, [key]: next };
      loadState = asReadyState(next);
    } catch (error) {
      loadState = { status: 'error', message: stateMessage(error) };
    }
  };

  const refresh = async () => {
    if (!game) return;
    const previous = snapshot;
    if (previous) loadState = { status: 'refreshing', snapshot: previous };
    else loadState = { status: 'loading' };
    try {
      const next = await gameRepository.getOffers(game.slug, edition);
      editionSnapshots = { ...editionSnapshots, [edition]: next };
      loadState = asReadyState(next);
      editionAvailability = await gameRepository.getEditionAvailability(game.slug);
    } catch (error) {
      loadState = previous
        ? {
            status: 'stale',
            snapshot: { ...previous, stale: true },
            message: stateMessage(error)
          }
        : { status: 'error', message: stateMessage(error) };
    }
  };

  const clearDemoState = async () => {
    if (!demo) return;
    const next = new URL(page.url);
    next.searchParams.delete('state');
    await goto(`${next.pathname}${next.search}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true
    });
  };

  const showAllWithWarnings = () => {
    thaiOnly = false;
  };

  const retryPrices = async () => {
    await clearDemoState();
    await refresh();
  };

  $effect(() => {
    const currentSlug = slug;
    void loadGame(currentSlug);
  });

  $effect(() => {
    const currentRange = range;
    const currentSlug = slug;
    void gameRepository.getPriceHistory(currentSlug, currentRange).then((value) => {
      if (currentSlug === slug && currentRange === range) history = value;
    });
  });
</script>

<svelte:head>
  <title>{game?.title ?? 'เกม'} — เปรียบเทียบราคา | KeyRadar TH</title>
</svelte:head>

{#if game}
  <main>
    <div class="page game-page" class:with-sticky={shouldShowSticky}>
      <nav class="crumb"><a href="/">หน้าแรก</a><span>/</span><a href="/popular">เกมยอดนิยม</a><span>/</span><b>{game.title}</b></nav>

      <section class="game-head">
        <div class="cover"><GameCover title={game.title} hue={game.hue} height={232} large /><span class="steam-badge"><Icon name="steam" size={12} /> STEAM</span></div>
        <div class="game-info">
          <div class="tags"><span class="tag"><Icon name="steam" size={12} /> Steam</span>{#each game.genres as genre}<span class="tag">{genre}</span>{/each}</div>
          <h1>{game.title}</h1>
          <div class="meta">
            <p><small>ผู้พัฒนา</small>{game.developer}</p><p><small>ผู้จัดจำหน่าย</small>{game.publisher}</p><p><small>วันวางจำหน่าย</small>{game.releaseDate}</p><p><small>หมวดหมู่</small>{game.genres.join(' · ')}</p>
          </div>
          <div class="statuses">
            <div class="review"><b>{game.reviewPercent}%</b><span><strong>{game.reviewPercent >= 90 ? 'แง่บวกอย่างมาก' : 'แง่บวกเป็นส่วนใหญ่'}</strong><small>รีวิว Steam {game.reviewCount.toLocaleString('th-TH')} รายการ</small></span></div>
            <div class="thai" class:warn={activationStatus === 'uncertain'} class:bad={activationStatus === 'blocked'}>
              <b><Icon name={activationStatus === 'confirmed' ? 'check' : activationStatus === 'uncertain' ? 'warning' : 'x'} size={17} /></b>
              <span>
                <strong>{activationStatus === 'confirmed' ? 'สามารถเปิดใช้งานในประเทศไทยได้' : activationStatus === 'uncertain' ? 'ควรตรวจสอบรายละเอียดภูมิภาคก่อนซื้อ' : 'ยังไม่พบข้อเสนอที่ใช้งานในไทยได้'}</strong>
                <small>{activationStatus === 'confirmed' ? `ยืนยันแล้ว ${confirmedCount} ข้อเสนอ` : activationStatus === 'uncertain' ? 'ผู้ขายไม่ได้ระบุภูมิภาคอย่างชัดเจน' : 'ทุกข้อเสนอที่พบล็อกภูมิภาคอื่น'}</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div class="editions">
        <span>เวอร์ชัน</span>
        <div>
          {#each game.editions as item}
            {@const availability = editionAvailability.find((entry) => entry.editionKey === item.key)}
            <button class:active={edition === item.key} onclick={() => selectEdition(item.key)}>
              {item.name}
              <small class:unavailable={!availability?.availableInThailand}>{availability?.minimumPriceSatang ? `จาก ${formatBaht(availability.minimumPriceSatang)}` : 'ยังไม่มีข้อเสนอที่ใช้ในไทยได้'}</small>
            </button>
          {/each}
        </div>
      </div>

      {#if loadState.status === 'loading'}
        <div class="loading-grid" aria-label="กำลังดึงข้อมูลราคา">{#each [1, 2, 3] as item}<div style={`animation-delay:${item * .08}s`}></div>{/each}</div>
      {:else if isNoPrice}
        <EmptyState kind="no-price" query={game.title} action={retryPrices} />
      {:else}
        {#if best && bestStore}
          <section class="summary">
            <article class="best surface">
              <div class="best-tag"><Icon name="check" size={12} /> ถูกที่สุดที่ใช้งานในไทยได้</div>
              <div class="best-row">
                <div class="store"><StoreLogo initials={bestStore.initials} type={bestStore.type} size={42} /><span><strong>{bestStore.name}</strong><small>{storeTypeLabel(bestStore.type)}</small></span></div>
                <div class="sum-price"><small>ราคาสุทธิโดยประมาณ</small><div><strong>{formatBaht(best.finalSatang)}</strong><span><s>{formatBaht(steamPrice)}</s><b>ประหยัด {formatBaht(Math.max(0, steamPrice - best.finalSatang))}</b></span></div><p>{best.fees.length ? `ราคาโฆษณา ${formatBaht(best.advertisedSatang)} + ค่าธรรมเนียม ${formatBaht(offerFeeTotal(best))}` : 'ไม่มีค่าธรรมเนียมเพิ่มเติมที่ทราบ'}</p></div>
              </div>
              <div class="best-foot"><span><Icon name="clock" size={13} /> อัปเดตล่าสุด {formatRelativeMinutes(best.updatedMinutesAgo)} · 2 ส.ค. 2569</span><button class="btn buy" onclick={() => dialogOffer = best}>ไปยังร้านค้า {bestStore.name}<Icon name="external" size={14} /></button></div>
            </article>
            <article class="steam-ref surface"><small>ราคาบน Steam</small><strong>{formatBaht(steamPrice)}</strong><p>ซื้อโดยตรงจาก Steam ประเทศไทย — เปิดใช้งานได้แน่นอน ไม่มีค่าธรรมเนียมแฝง แต่ไม่ใช่ราคาที่ถูกที่สุด</p><div></div><p><span>ส่วนต่างจากราคาต่ำสุด</span><b>−{formatBaht(Math.max(0, steamPrice - best.finalSatang))}</b></p><p><span>จำนวนร้านที่เทียบ</span><b>{offers.length} ร้าน</b></p><p><span>ใช้งานในไทยได้</span><b>{confirmedCount} ร้าน</b></p></article>
          </section>
        {/if}

        <section class="offers">
          <header><div><h2>เปรียบเทียบราคา {offers.length} ร้าน</h2><p>เรียงตามราคาสุทธิหลังรวมค่าธรรมเนียมที่ทราบ · กดแถวเพื่อดูรายละเอียด</p></div><div><label><input type="checkbox" bind:checked={thaiOnly} /> เฉพาะที่ใช้งานในไทยได้</label><button class="btn" onclick={refresh} disabled={isRefreshing}><Icon class={isRefreshing ? 'spin' : ''} name="refresh" size={15} /> รีเฟรช</button></div></header>
          {#if isRefreshing}<div class="state-banner warn"><Icon class="spin" name="refresh" size={17} /><span><strong>กำลังดึงราคาล่าสุดจากร้านค้า</strong>ข้อมูลที่แสดงอาจยังไม่ใช่ราคาปัจจุบัน จะอัปเดตอัตโนมัติเมื่อดึงเสร็จ</span></div>{/if}
          {#if isStoreDown}<div class="state-banner warn"><Icon name="warning" size={17} /><span><strong>ร้านค้าบางแห่งไม่ตอบสนองชั่วคราว</strong>ราคาที่แสดงเป็นข้อมูลจากการดึงครั้งก่อนและอาจไม่ใช่ราคาปัจจุบัน</span></div>{/if}
          {#if activationStatus === 'uncertain'}<div class="state-banner warn"><Icon name="warning" size={17} /><span><strong>ควรตรวจสอบรายละเอียดภูมิภาคก่อนซื้อ</strong>ผู้ขายไม่ได้ระบุรายชื่อประเทศที่รองรับอย่างชัดเจน</span></div>{/if}
          {#if visibleOffers.length}
            <div class="desktop-table"><OfferTable offers={visibleOffers} {stores} bestId={best?.id} onbuy={(offer) => dialogOffer = offer} /></div>
            <div class="mobile-cards">{#each visibleOffers as offer}{@const store = stores.find((item) => item.id === offer.storeId) ?? stores[0]}<OfferCard {offer} {store} best={offer.id === best?.id} expanded={expanded[offer.id] ?? false} onbuy={(item) => dialogOffer = item} />{/each}</div>
          {:else}
            <EmptyState kind="no-th" query={game.title} action={showAllWithWarnings} />
          {/if}
          <div class="notice"><Icon name="warning" size={16} />ราคาและเงื่อนไขภูมิภาคอาจเปลี่ยนแปลงได้ กรุณาตรวจสอบรายละเอียดบนหน้าร้านค้าก่อนชำระเงิน</div>
        </section>

        {#if best && bestStore}
          <section class="history">
            <header><div><h2>ประวัติราคา</h2><p>ราคาสุทธิต่ำสุดที่ใช้งานในไทยได้ เทียบกับราคาบน Steam</p></div><div class="ranges">{#each [[30, '30 วัน'], [92, '3 เดือน'], [183, '6 เดือน'], [365, '1 ปี'], [900, 'ทั้งหมด']] as item}<button class:active={range === item[0]} onclick={() => range = Number(item[0])}>{item[1]}</button>{/each}</div></header>
            {#if history.length}<PriceChart points={history} steamPriceSatang={steamPrice} /><div class="chart-stats"><article><small>ราคาต่ำสุดตอนนี้</small><strong class="ok">{formatBaht(best.finalSatang)}</strong><span>{bestStore.name}</span></article><article><small>ต่ำสุดในช่วงนี้</small><strong>{formatBaht(stats[0])}</strong><span>จากข้อมูลที่เก็บได้</span></article><article><small>ราคาเฉลี่ย</small><strong>{formatBaht(stats[1])}</strong><span>ตลอดช่วงที่เลือก</span></article><article><small>ราคาบน Steam</small><strong>{formatBaht(steamPrice)}</strong><span>ร้านค้าประเทศไทย</span></article></div>{/if}
          </section>
        {/if}
      {/if}
    </div>
  </main>

  {#if shouldShowSticky && best && bestStore}
    <div class="sticky-buy"><span><small>ถูกที่สุดที่ใช้งานในไทยได้ · {bestStore.name}</small><span><strong>{formatBaht(best.finalSatang)}</strong><s>{formatBaht(steamPrice)}</s></span></span><button onclick={() => dialogOffer = best}>ไปยังร้านค้า<Icon name="external" size={14} /></button></div>
  {/if}

  {#if dialogOffer}
    {@const store = stores.find((item) => item.id === dialogOffer?.storeId) ?? stores[0]}
    <ExitDialog offer={dialogOffer} {game} {store} onclose={() => dialogOffer = null} />
  {/if}
{:else}
  <main class="page"><EmptyState kind="no-results" query={slug} action={() => void goto('/')} /></main>
{/if}

<style>
  .crumb { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 16px; color: var(--mute2); font-size: 12px; }
  .crumb a { color: var(--mute); }
  .crumb b { color: var(--ink); }
  .game-head { display: flex; align-items: flex-start; gap: 26px; margin-bottom: 26px; }
  .cover { position: relative; width: 400px; flex: none; }
  .steam-badge { position: absolute; left: 14px; bottom: 12px; display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 8px; background: rgb(9 11 18 / 72%); font-size: 10.5px; }
  .game-info { min-width: 0; flex: 1; }
  .tags { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 9px; }
  .tags .tag { gap: 5px; }
  .game-info h1 { font-size: 37px; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 14px; }
  .meta p { display: flex; flex-direction: column; font-size: 13px; }
  .meta small { color: var(--mute2); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; }
  .statuses { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
  .review, .thai { display: flex; align-items: center; gap: 9px; }
  .review > b { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid var(--ok-line); border-radius: 11px; background: var(--ok-dim); color: var(--ok); }
  .review span, .thai span { display: flex; flex-direction: column; }
  .review small, .thai small { color: currentColor; opacity: .72; font-size: 11px; }
  .thai { padding: 9px 14px 9px 10px; border: 1px solid var(--ok-line); border-radius: 12px; background: var(--ok-dim); color: var(--ok); }
  .thai > b { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 9px; background: rgb(0 0 0 / 22%); }
  .thai.warn { border-color: var(--warn-line); background: var(--warn-dim); color: var(--warn); }
  .thai.bad { border-color: var(--bad-line); background: var(--bad-dim); color: var(--bad); }
  .editions { display: flex; align-items: center; gap: 12px; overflow: hidden; padding: 12px 0 18px; border-top: 1px solid var(--line2); }
  .editions > span { color: var(--mute2); font-size: 11px; text-transform: uppercase; }
  .editions > div { display: flex; gap: 6px; overflow: auto; }
  .editions button { min-height: 46px; display: flex; align-items: flex-start; flex-direction: column; justify-content: center; gap: 3px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 10px; background: transparent; color: var(--ink); white-space: nowrap; cursor: pointer; }
  .editions button.active { border-color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 13%, transparent); color: var(--color-accent-200); }
  .editions small { color: var(--mute2); }
  .editions small.unavailable { color: var(--warn); }
  .loading-grid { display: grid; gap: 10px; }
  .loading-grid div { height: 118px; border: 1px solid var(--line2); border-radius: 13px; background: linear-gradient(100deg, #1b1e2c 30%, #23273a 50%, #1b1e2c 70%); background-size: 720px 100%; animation: shimmer 1.25s infinite; }
  .summary { display: grid; grid-template-columns: 1.85fr 1fr; gap: 14px; margin-bottom: 26px; }
  .best { position: relative; overflow: hidden; padding: 20px; border-color: var(--ok-line); background: radial-gradient(70% 130% at 6% 0%, color-mix(in srgb, var(--ok) 13%, transparent), transparent 68%), linear-gradient(160deg, #1d2130, #191c29); }
  .best-tag { width: fit-content; display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 7px; background: var(--ok-dim); color: var(--ok); font-size: 11px; font-weight: 700; }
  .best-row { display: flex; justify-content: space-between; gap: 16px; margin-top: 14px; }
  .store { display: flex; align-items: center; gap: 11px; }
  .store > span { display: flex; flex-direction: column; }
  .store small { color: var(--mute); }
  .sum-price { display: flex; align-items: flex-end; flex-direction: column; gap: 5px; text-align: right; }
  .sum-price > small { color: var(--mute2); font-size: 10.5px; text-transform: uppercase; }
  .sum-price > div { display: flex; align-items: baseline; gap: 10px; }
  .sum-price > div > strong { color: var(--ok); font-size: 46px; letter-spacing: -.035em; }
  .sum-price > div > span { display: flex; flex-direction: column; }
  .sum-price > div b { color: var(--ok); font-size: 11.5px; }
  .sum-price p { color: var(--mute); font-size: 11.5px; }
  .best-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 14px; padding-top: 13px; border-top: 1px solid var(--line2); color: var(--mute2); font-size: 11.5px; }
  .best-foot > span, .best-foot .buy { display: inline-flex; align-items: center; gap: 6px; }
  .buy { height: 46px; border-color: var(--ok-line); background: var(--ok-dim); color: var(--ok); }
  .steam-ref { display: flex; flex-direction: column; gap: 7px; padding: 20px; }
  .steam-ref > small { color: var(--mute2); text-transform: uppercase; }
  .steam-ref > strong { font-size: 23px; }
  .steam-ref > p { display: flex; justify-content: space-between; color: var(--mute); font-size: 11.5px; }
  .steam-ref > p:first-of-type { display: block; line-height: 1.55; }
  .steam-ref > div { height: 1px; background: var(--line2); }
  .steam-ref b { color: var(--ink); }
  .offers > header, .history > header { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 12px; }
  .offers h2, .history h2 { font-size: 20px; }
  .offers header p, .history header p { margin-top: 4px; color: var(--mute2); font-size: 12px; }
  .offers header > div:last-child { display: flex; align-items: center; gap: 8px; }
  .offers label { color: var(--mute); font-size: 12.5px; }
  .offers input { accent-color: var(--color-accent); }
  .state-banner { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; padding: 11px 14px; border-radius: 11px; font-size: 12.5px; }
  .state-banner.warn { border: 1px solid var(--warn-line); background: var(--warn-dim); color: var(--warn); }
  .state-banner span { display: flex; flex-direction: column; }
  .state-banner strong { font-size: 13px; }
  :global(svg.spin) { animation: spin 1s linear infinite; }
  .desktop-table { overflow: auto; }
  .mobile-cards { display: none; }
  .notice { display: flex; align-items: flex-start; gap: 8px; margin-top: 16px; padding: 12px 14px; border: 1px solid var(--warn-line); border-radius: 12px; background: var(--warn-dim); color: var(--warn); font-size: 12.5px; }
  .history { margin-top: 34px; }
  .ranges { display: flex; gap: 4px; padding: 3px; border: 1px solid var(--line); border-radius: 10px; background: rgb(233 233 237 / 3%); overflow: auto; }
  .ranges button { min-height: 34px; padding: 6px 11px; border: 0; border-radius: 8px; background: transparent; color: var(--mute); white-space: nowrap; cursor: pointer; }
  .ranges button.active { background: color-mix(in srgb, var(--color-accent) 18%, transparent); color: var(--color-accent-200); }
  .chart-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 12px; }
  .chart-stats article { display: flex; flex-direction: column; gap: 4px; padding: 11px 13px; border: 1px solid var(--line); border-radius: 11px; background: rgb(233 233 237 / 2.5%); }
  .chart-stats small { color: var(--mute2); text-transform: uppercase; }
  .chart-stats strong { font-size: 20px; }
  .chart-stats strong.ok { color: var(--ok); }
  .chart-stats span { color: var(--mute2); font-size: 11px; }
  .sticky-buy { display: none; }

  @media (max-width: 1179px) {
    .game-info h1 { font-size: 31px; }
    .meta { grid-template-columns: repeat(2, 1fr); }
    .summary { grid-template-columns: 1fr; }
  }

  @media (max-width: 779px) {
    .game-page.with-sticky { padding-bottom: calc(104px + env(safe-area-inset-bottom)); }
    .game-head { flex-direction: column; gap: 14px; }
    .cover { width: 100%; }
    .cover :global(.cover) { height: 168px !important; }
    .game-info h1 { font-size: 25px; }
    .meta { grid-template-columns: repeat(2, 1fr); }
    .thai { width: 100%; }
    .best { padding: 16px; }
    .best-row { flex-direction: column; }
    .sum-price { align-items: flex-start; text-align: left; }
    .sum-price > div > strong { font-size: 40px; }
    .best-foot .buy { width: 100%; }
    .offers header > div:last-child .btn { display: none; }
    .desktop-table { display: none; }
    .mobile-cards { display: flex; flex-direction: column; gap: 10px; }
    .chart-stats { grid-template-columns: repeat(2, 1fr); }
    .ranges button { min-height: 44px; }
    .sticky-buy { position: fixed; left: 0; right: 0; bottom: 0; z-index: 55; display: flex; align-items: center; gap: 12px; padding: 10px 14px calc(10px + env(safe-area-inset-bottom)); border-top: 1px solid var(--line); background: color-mix(in srgb, var(--color-bg) 94%, transparent); backdrop-filter: blur(16px); box-shadow: 0 -12px 32px rgb(0 0 0 / 24%); }
    .sticky-buy > span { display: flex; min-width: 0; flex: 1; flex-direction: column; }
    .sticky-buy > span > span { display: flex; align-items: baseline; gap: 8px; }
    .sticky-buy small, .sticky-buy s { color: var(--mute2); font-size: 10.5px; }
    .sticky-buy strong { color: var(--ok); font-size: 21px; }
    .sticky-buy button { height: 46px; display: inline-flex; align-items: center; gap: 7px; padding: 0 18px; border: 1px solid var(--ok-line); border-radius: 12px; background: var(--ok-dim); color: var(--ok); font-weight: 600; }
  }
</style>
