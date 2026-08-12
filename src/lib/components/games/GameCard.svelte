<script lang="ts">
  import type { Game, Offer, Store } from '$lib/domain/models'
  import { discountPercent } from '$lib/domain/pricing'
  import {
    regionPresentation,
    regionStatusLabel,
    storeTypeLabel
  } from '$lib/domain/presentation'
  import { formatBaht } from '$lib/utils/currency'
  import GameCover from '$lib/components/ui/GameCover.svelte'
  import Icon from '$lib/components/ui/Icon.svelte'
  import StoreLogo from '$lib/components/ui/StoreLogo.svelte'
  let {
    game,
    offer,
    store,
    storeCount = 10
  }: { game: Game; offer: Offer; store: Store; storeCount?: number } = $props()
  const discount = $derived(discountPercent(offer))
  const region = $derived(regionPresentation(offer.region))
  const confirmed = $derived(offer.regionStatus === 'confirmed')
</script>

<a class="card surface" href={`/games/${game.slug}`} data-testid="game-card">
  <div class="visual">
    <GameCover title={game.title} hue={game.hue} /><span class="steam"
      ><Icon name="steam" size={10} /> STEAM</span
    >{#if discount}<span class="discount" class:confirmed>−{discount}%</span
      >{/if}
  </div>
  <div class="body">
    <h3>{game.title}</h3>
    <div class="regions">
      <span class="tag">{region.label}</span><span
        class="tag"
        class:tag-ok={confirmed}
        class:tag-warn={offer.regionStatus === 'uncertain'}
        class:tag-bad={offer.regionStatus === 'blocked'}
        >{#if confirmed}<Icon
            name="check"
            size={10}
          />{:else if offer.regionStatus === 'blocked'}<Icon
            name="x"
            size={10}
          />{:else}<Icon name="warning" size={10} />{/if}{regionStatusLabel(
          offer.regionStatus
        )}</span
      >
    </div>
    <div class="prices">
      <strong class:confirmed>{formatBaht(offer.finalSatang)}</strong><s
        >{formatBaht(offer.steamPriceSatang)}</s
      >
    </div>
    <div class="store">
      <StoreLogo initials={store.initials} type={store.type} size={26} /><span
        >{store.name}<small>{storeTypeLabel(store.type)}</small></span
      >
    </div>
    <div class="foot">
      <span>เทียบ {storeCount} ร้าน</span><b
        >เปรียบเทียบราคา <Icon name="arrowRight" size={12} /></b
      >
    </div>
  </div>
</a>

<style>
  .card {
    height: 100%;
    display: flex;
    overflow: hidden;
    flex-direction: column;
    color: var(--ink);
    transition: border-color 0.15s;
  }
  .card:hover {
    border-color: color-mix(in srgb, var(--color-accent) 46%, transparent);
  }
  .visual {
    position: relative;
  }
  .visual :global(.cover) {
    border-radius: 0;
  }
  .steam,
  .discount {
    position: absolute;
    top: 8px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 7px;
    border-radius: 6px;
    background: rgb(9 11 18 / 75%);
    backdrop-filter: blur(6px);
    font-size: 9px;
    font-weight: 700;
  }
  .steam {
    left: 8px;
  }
  .discount {
    right: 8px;
    color: var(--color-accent-300);
    font-size: 11.5px;
  }
  .discount.confirmed {
    color: var(--ok);
  }
  .body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 9px;
    padding: 11px 12px 12px;
  }
  .body h3 {
    min-height: 35px;
    font-size: 13.5px;
    line-height: 1.3;
  }
  .regions {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }
  .prices {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-top: auto;
  }
  .prices strong {
    color: var(--ink);
    font-size: 21px;
    letter-spacing: -0.025em;
  }
  .prices strong.confirmed {
    color: var(--ok);
  }
  .prices s {
    color: var(--mute2);
    font-size: 12px;
  }
  .store {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .store > span {
    display: flex;
    min-width: 0;
    flex-direction: column;
    color: var(--mute);
    font-size: 11.5px;
  }
  .store small {
    color: var(--mute2);
    font-size: 9.5px;
  }
  .foot {
    display: flex;
    justify-content: space-between;
    gap: 5px;
    padding-top: 9px;
    border-top: 1px solid var(--line2);
    color: var(--mute2);
    font-size: 11px;
  }
  .foot b {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--color-accent);
    font-size: 11.5px;
  }
  @media (max-width: 500px) {
    .body {
      padding: 9px;
    }
    .foot b {
      font-size: 0;
    }
    .foot b::after {
      content: 'ดูราคา';
      font-size: 11px;
    }
  }
</style>
