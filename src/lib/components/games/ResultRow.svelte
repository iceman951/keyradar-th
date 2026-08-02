<script lang="ts">
  import type { Game, Offer, Store } from '$lib/domain/models';
  import { discountPercent } from '$lib/domain/pricing';
  import { formatBaht } from '$lib/utils/currency';
  import GameCover from '$lib/components/ui/GameCover.svelte';
  import StoreLogo from '$lib/components/ui/StoreLogo.svelte';
  let { game, offer, store }: { game: Game; offer: Offer; store: Store } = $props();
</script>

<a class="row surface" href={`/games/${game.slug}`}>
  <div class="cover"><GameCover title={game.title} hue={game.hue} height={105} /></div>
  <div class="info"><div class="tags"><span class="tag">● STEAM</span><span class="tag tag-ok">✓ ใช้งานในไทยได้</span></div><h2>{game.title}</h2><span class="muted">วางจำหน่าย {game.releaseDate} · {game.genres.join(' · ')}</span><div class="store"><StoreLogo initials={store.initials} type={store.type} size={26} /><span>ถูกที่สุดที่ {store.name}</span></div></div>
  <div class="price"><small>ราคาสุทธิโดยประมาณ</small><div><strong>{formatBaht(offer.finalSatang)}</strong><span>−{discountPercent(offer)}%</span></div><p>ราคา Steam <s>{formatBaht(offer.steamPriceSatang)}</s> · เทียบ 10 ร้าน</p><span class="btn btn-accent">เปรียบเทียบราคา →</span></div>
</a>

<style>
  .row{display:flex;align-items:center;gap:16px;padding:14px;color:var(--ink)}.row:hover{border-color:color-mix(in srgb,var(--color-accent) 46%,transparent)}.cover{width:168px;flex:none}.info{display:flex;min-width:0;flex:1;flex-direction:column;gap:7px}.tags{display:flex;gap:6px}.info h2{font-size:17px}.info>.muted{font-size:12px}.store{display:flex;align-items:center;gap:8px;color:var(--mute);font-size:12px}.price{min-width:210px;display:flex;align-items:flex-end;flex-direction:column;gap:5px;text-align:right}.price>small{color:var(--mute2);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase}.price div{display:flex;align-items:baseline;gap:8px}.price strong{color:var(--ok);font-size:27px}.price div span{padding:2px 7px;border-radius:7px;background:var(--ok-dim);color:var(--ok);font-weight:700}.price p{color:var(--mute2);font-size:12px}.price>.btn{min-height:36px;margin-top:5px;font-size:13px}
  @media(max-width:779px){.row{align-items:stretch;flex-direction:column;padding:12px}.cover{width:100%}.cover :global(.cover){height:140px!important}.price{width:100%;min-width:0;align-items:flex-start;padding-top:10px;border-top:1px solid var(--line2);text-align:left}.price>.btn{width:100%;min-height:44px}}
</style>
