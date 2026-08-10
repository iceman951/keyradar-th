<script lang="ts">
  import type { Game, Offer, Store } from '$lib/domain/models';
  import { discountPercent } from '$lib/domain/pricing';
  import { regionPresentation, regionStatusLabel, storeTypeLabel } from '$lib/domain/presentation';
  import { formatBaht } from '$lib/utils/currency';
  import GameCover from '$lib/components/ui/GameCover.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import StoreLogo from '$lib/components/ui/StoreLogo.svelte';
  let { game, offer, store }: { game: Game; offer: Offer; store: Store } = $props();
  const region = $derived(regionPresentation(offer.region));
  const confirmed = $derived(offer.regionStatus === 'confirmed');
</script>

<a class="row surface" href={`/games/${game.slug}`}>
  <div class="cover"><GameCover title={game.title} hue={game.hue} height={105} /></div>
  <div class="info"><div class="tags"><span class="tag"><Icon name="steam" size={10} /> STEAM</span><span class="tag">{region.label}</span><span class="tag" class:tag-ok={confirmed} class:tag-warn={offer.regionStatus === 'uncertain'} class:tag-bad={offer.regionStatus === 'blocked'}>{#if confirmed}<Icon name="check" size={10} />{:else if offer.regionStatus === 'blocked'}<Icon name="x" size={10} />{:else}<Icon name="warning" size={10} />{/if}{regionStatusLabel(offer.regionStatus)}</span></div><h2>{game.title}</h2><span class="muted">วางจำหน่าย {game.releaseDate} · {game.genres.join(' · ')}</span><div class="store"><StoreLogo initials={store.initials} type={store.type} size={26} /><span>ถูกที่สุดที่ {store.name}</span><small>{storeTypeLabel(store.type)}</small></div></div>
  <div class="price"><small>ราคาสุทธิโดยประมาณ</small><div><strong class:confirmed>{formatBaht(offer.finalSatang)}</strong>{#if discountPercent(offer)}<span class:confirmed>−{discountPercent(offer)}%</span>{/if}</div><p>ราคา Steam <s>{formatBaht(offer.steamPriceSatang)}</s>{#if offer.approximate} · ราคาแปลงโดยประมาณ{/if}</p><span class="btn btn-accent">เปรียบเทียบราคา <Icon name="arrowRight" size={13} /></span></div>
</a>

<style>
  .row{display:flex;align-items:center;gap:16px;padding:14px;color:var(--ink)}.row:hover{border-color:color-mix(in srgb,var(--color-accent) 46%,transparent)}.cover{width:168px;flex:none}.info{display:flex;min-width:0;flex:1;flex-direction:column;gap:7px}.tags{display:flex;gap:6px;flex-wrap:wrap}.info h2{font-size:17px}.info>.muted{font-size:12px}.store{display:flex;align-items:center;gap:8px;color:var(--mute);font-size:12px}.store small{color:var(--mute2);font-size:10px}.price{min-width:210px;display:flex;align-items:flex-end;flex-direction:column;gap:5px;text-align:right}.price>small{color:var(--mute2);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase}.price div{display:flex;align-items:baseline;gap:8px}.price strong{color:var(--ink);font-size:27px}.price strong.confirmed{color:var(--ok)}.price div span{padding:2px 7px;border:1px solid color-mix(in srgb,var(--color-accent) 32%,transparent);border-radius:7px;background:color-mix(in srgb,var(--color-accent) 10%,transparent);color:var(--color-accent-300);font-weight:700}.price div span.confirmed{border-color:var(--ok-line);background:var(--ok-dim);color:var(--ok)}.price p{color:var(--mute2);font-size:12px}.price>.btn{min-height:36px;gap:6px;margin-top:5px;font-size:13px}
  @media(max-width:779px){.row{align-items:stretch;flex-direction:column;padding:12px}.cover{width:100%}.cover :global(.cover){height:140px!important}.price{width:100%;min-width:0;align-items:flex-start;padding-top:10px;border-top:1px solid var(--line2);text-align:left}.price>.btn{width:100%;min-height:44px}}
</style>
