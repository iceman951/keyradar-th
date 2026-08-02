<script lang="ts">
  import type { Offer, Store } from '$lib/domain/models';
  import { discountPercent } from '$lib/domain/pricing';
  import { formatBaht } from '$lib/utils/currency';
  import { formatRelativeMinutes } from '$lib/utils/date';
  import StoreLogo from '$lib/components/ui/StoreLogo.svelte';
  let { offer, store, best = false, expanded = $bindable(false), onbuy }: { offer: Offer; store: Store; best?: boolean; expanded?: boolean; onbuy: (offer: Offer) => void } = $props();
</script>

<article class="card surface" class:best>
  {#if best}<div class="bestbar">✓ ถูกที่สุดที่ใช้งานในไทยได้</div>{/if}
  <div class="body"><div class="store"><StoreLogo initials={store.initials} type={store.type} size={38} /><span><strong>{store.name}</strong><small>{store.type === 'official' ? 'ร้านค้าอย่างเป็นทางการ' : store.type === 'marketplace' ? 'Marketplace' : 'ตัวแทนจำหน่ายคีย์'}</small></span><time>{formatRelativeMinutes(offer.updatedMinutesAgo)}</time></div>
    <div class="price"><span><small>ราคาสุทธิโดยประมาณ</small><strong>{formatBaht(offer.finalSatang)}</strong><em>โฆษณา <s>{formatBaht(offer.advertisedSatang)}</s> · ค่าธรรมเนียม {offer.feeSatang ? formatBaht(offer.feeSatang) : 'ไม่มี'}</em></span><b>−{discountPercent(offer)}%</b></div>
    <div class="tags"><span class="tag">{offer.region}</span><span class:tag-ok={offer.regionStatus === 'confirmed'} class:tag-warn={offer.regionStatus !== 'confirmed'} class="tag">{offer.regionStatus === 'confirmed' ? '✓ ใช้งานในไทยได้' : 'ตรวจสอบภูมิภาค'}</span><span class="tag">{offer.drm}</span></div>
    {#if expanded}<div class="details"><h4>รายละเอียดราคา</h4><p><span>ราคาที่โฆษณา</span><b>{formatBaht(offer.advertisedSatang)}</b></p><p><span>ค่าธรรมเนียม</span><b>{offer.feeSatang ? `+ ${formatBaht(offer.feeSatang)}` : '—'}</b></p><p class="total"><span>ราคาสุทธิ</span><b>{formatBaht(offer.finalSatang)}</b></p><h4>ข้อควรทราบ</h4><small>{store.note}</small></div>{/if}
    <div class="actions"><button class="btn" onclick={() => expanded = !expanded}>รายละเอียด {expanded ? '⌃' : '⌄'}</button>{#if offer.inStock}<button class="btn buy" onclick={() => onbuy(offer)}>ไปยังร้านค้า ↗</button>{:else}<span class="oos">สินค้าหมด</span>{/if}</div>
  </div>
</article>

<style>
  .card{overflow:hidden}.card.best{border-color:var(--ok-line)}.bestbar{padding:6px 13px;background:var(--ok-dim);color:var(--ok);font-size:11px;font-weight:700}.body{display:flex;flex-direction:column;gap:12px;padding:13px}.store{display:flex;align-items:center;gap:11px}.store>span{display:flex;min-width:0;flex:1;flex-direction:column}.store small{color:var(--mute2)}time{color:var(--mute2);font-size:10.5px}.price{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}.price>span{display:flex;flex-direction:column}.price small{color:var(--mute2);font-size:10px;letter-spacing:.08em;text-transform:uppercase}.price strong{color:var(--ok);font-size:25px}.price em{color:var(--mute);font-size:11.5px;font-style:normal}.price>b{padding:4px 10px;border:1px solid var(--ok-line);border-radius:9px;background:var(--ok-dim);color:var(--ok)}.tags{display:flex;gap:6px;flex-wrap:wrap}.details{padding:12px;border:1px solid var(--line2);border-radius:11px;background:var(--sunk);animation:rise .16s}.details h4{margin:4px 0 8px;color:var(--mute2);font-size:10px;letter-spacing:.08em;text-transform:uppercase}.details p{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--line2);font-size:12px}.details .total{color:var(--ok)}.details small{color:var(--mute);line-height:1.6}.actions{display:flex;gap:8px}.actions>*{flex:1;height:46px}.buy{border-color:var(--ok-line);background:var(--ok-dim);color:var(--ok);font-weight:600}.oos{display:grid;place-items:center;border:1px solid var(--bad-line);border-radius:11px;background:var(--bad-dim);color:var(--bad);font-weight:600}
</style>
