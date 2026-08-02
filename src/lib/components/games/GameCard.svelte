<script lang="ts">
  import type { Game, Offer, Store } from '$lib/domain/models';
  import { discountPercent } from '$lib/domain/pricing';
  import { formatBaht } from '$lib/utils/currency';
  import GameCover from '$lib/components/ui/GameCover.svelte';
  import StoreLogo from '$lib/components/ui/StoreLogo.svelte';
  let { game, offer, store, storeCount = 10 }: { game: Game; offer: Offer; store: Store; storeCount?: number } = $props();
  const discount = $derived(discountPercent(offer));
</script>

<a class="card surface" href={`/games/${game.slug}`} data-testid="game-card">
  <div class="visual"><GameCover title={game.title} hue={game.hue} /><span class="steam">● STEAM</span>{#if discount}<span class="discount">−{discount}%</span>{/if}</div>
  <div class="body"><h3>{game.title}</h3><span class="tag tag-ok">✓ ใช้งานในไทยได้</span>
    <div class="prices"><strong>{formatBaht(offer.finalSatang)}</strong><s>{formatBaht(offer.steamPriceSatang)}</s></div>
    <div class="store"><StoreLogo initials={store.initials} type={store.type} size={26} /><span>{store.name}<small>{store.type === 'official' ? 'ร้านค้าอย่างเป็นทางการ' : store.type === 'marketplace' ? 'Marketplace' : 'ตัวแทนจำหน่ายคีย์'}</small></span></div>
    <div class="foot"><span>เทียบ {storeCount} ร้าน</span><b>เปรียบเทียบราคา →</b></div>
  </div>
</a>

<style>
  .card{height:100%;display:flex;overflow:hidden;flex-direction:column;color:var(--ink);transition:border-color .15s}.card:hover{border-color:color-mix(in srgb,var(--color-accent) 46%,transparent)}.visual{position:relative}.visual :global(.cover){border-radius:0}.steam,.discount{position:absolute;top:8px;padding:3px 7px;border-radius:6px;background:rgb(9 11 18 / 75%);backdrop-filter:blur(6px);font-size:9px;font-weight:700}.steam{left:8px}.discount{right:8px;color:var(--ok);font-size:11.5px}.body{display:flex;flex:1;flex-direction:column;gap:9px;padding:11px 12px 12px}.body h3{min-height:35px;font-size:13.5px;line-height:1.3}.prices{display:flex;align-items:baseline;gap:8px;margin-top:auto}.prices strong{color:var(--ok);font-size:21px;letter-spacing:-.025em}.prices s{color:var(--mute2);font-size:12px}.store{display:flex;align-items:center;gap:8px}.store>span{display:flex;min-width:0;flex-direction:column;color:var(--mute);font-size:11.5px}.store small{color:var(--mute2);font-size:9.5px}.foot{display:flex;justify-content:space-between;gap:5px;padding-top:9px;border-top:1px solid var(--line2);color:var(--mute2);font-size:11px}.foot b{color:var(--color-accent);font-size:11.5px}
  @media(max-width:500px){.body{padding:9px}.foot b{font-size:0}.foot b::after{content:'ดูราคา';font-size:11px}}
</style>
