<script lang="ts">
  import type { Game } from '$lib/domain/models';
  import { gameRepository } from '$lib/data/mock-repository';
  import { bestThaiOffer } from '$lib/domain/pricing';
  import { formatBaht } from '$lib/utils/currency';
  import Icon from '$lib/components/ui/Icon.svelte';

  let {
    games,
    query = '',
    loading = false,
    id = 'game-search-results',
    activeIndex = -1,
    onactive
  }: { games: Game[]; query?: string; loading?: boolean; id?: string; activeIndex?: number; onactive?: (index: number) => void } = $props();
  let prices = $state<Record<string, number>>({});
  let requestId = 0;

  $effect(() => {
    const current = games;
    const currentRequest = ++requestId;
    Promise.all(current.map(async (game) => {
      const snapshot = await gameRepository.getOffers(game.slug);
      return [game.slug, bestThaiOffer(snapshot.offers)?.finalSatang ?? game.editions[0].steamPriceSatang] as const;
    })).then((entries) => {
      if (currentRequest === requestId) prices = Object.fromEntries(entries);
    });
  });
</script>

<div class="autocomplete" {id} role="listbox" aria-label="ผลการค้นหาเกม" aria-busy={loading}>
  <div class="heading"><span>{query ? 'เกมที่ตรงกับคำค้นหา' : 'ค้นหายอดนิยม'}</span><span>ราคาสุทธิต่ำสุด</span></div>
  {#if loading}
    <div class="skeletons">{#each [1, 2, 3] as item}<div aria-hidden="true" style={`animation-delay:${item * .08}s`}></div>{/each}</div>
  {:else if games.length}
    {#each games as game, index}
      <a id={`${id}-option-${game.slug}`} class="row" class:active={activeIndex === index} role="option" aria-selected={activeIndex === index} href={`/games/${game.slug}`} onmouseenter={() => onactive?.(index)}>
        <span class="cover" style={`--hue:${game.hue}`}>{game.title}</span>
        <span class="meta"><strong>{game.title}</strong><small>{game.year} <span><Icon name="check" size={10} />ใช้งานในไทยได้</span></small></span>
        <span class="price"><strong>{formatBaht(prices[game.slug] ?? game.editions[0].steamPriceSatang)}</strong><small>ราคาสุทธิ</small></span>
      </a>
    {/each}
  {:else}
    <div class="empty"><strong>ไม่พบเกมที่ตรงกับ “{query}”</strong><span>ลองพิมพ์ชื่อเกมเป็นภาษาอังกฤษ หรือตรวจสอบตัวสะกดอีกครั้ง</span></div>
  {/if}
</div>

<style>
  .autocomplete{padding:6px;background:var(--raise)}
  .heading{display:flex;justify-content:space-between;padding:6px 10px 7px;color:var(--mute2);font-size:10.5px;letter-spacing:.09em;text-transform:uppercase}
  .row{display:flex;align-items:center;gap:11px;padding:7px 8px;border-radius:10px;color:var(--ink)}
  .row:hover,.row:focus-visible,.row.active{background:color-mix(in srgb,var(--color-accent) 12%,transparent)}
  .cover{width:78px;height:44px;flex:none;display:grid;place-items:center;padding:5px;border-radius:8px;background:linear-gradient(145deg,hsl(var(--hue) 35% 27%),hsl(calc(var(--hue) + 40) 40% 10%));font-size:8.5px;font-weight:700;text-align:center}
  .meta{display:flex;min-width:0;flex:1;flex-direction:column;gap:3px}.meta strong{overflow:hidden;font-size:13.5px;font-weight:500;text-overflow:ellipsis;white-space:nowrap}.meta small{color:var(--mute2)}.meta small span{display:inline-flex;align-items:center;gap:4px;margin-left:7px;color:var(--ok);font-size:10px;font-weight:600}
  .price{display:flex;align-items:flex-end;flex-direction:column}.price strong{color:var(--ok);font-size:14.5px}.price small{color:var(--mute2);font-size:9.5px}
  .empty{display:flex;flex-direction:column;gap:5px;padding:22px 14px;text-align:center}.empty span{color:var(--mute);font-size:12px}
  .skeletons{display:grid;gap:5px}.skeletons div{height:58px;border-radius:10px;background:linear-gradient(100deg,#212436 30%,#2b2f45 50%,#212436 70%);background-size:520px 100%;animation:shimmer 1.2s infinite}
  @media(max-width:520px){.heading{padding-inline:7px}.row{gap:9px}.cover{width:64px}.meta small span{display:none}.price strong{font-size:13.5px}}
</style>
