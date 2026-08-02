<script lang="ts">
  import type { Offer, Store } from '$lib/domain/models';
  import { discountPercent } from '$lib/domain/pricing';
  import { formatBaht } from '$lib/utils/currency';
  import { formatRelativeMinutes } from '$lib/utils/date';
  import StoreLogo from '$lib/components/ui/StoreLogo.svelte';
  let { offers, stores, bestId, onbuy }: { offers: Offer[]; stores: Store[]; bestId?: string; onbuy: (offer: Offer) => void } = $props();
  let expanded = $state<string | null>(null);
  const storeFor = (offer: Offer) => stores.find((store) => store.id === offer.storeId) ?? stores[0];
</script>

<div class="table surface">
  <div class="thead"><span>ร้านค้า</span><span>Edition</span><span>ภูมิภาค / การเปิดใช้งาน</span><span>ราคาโฆษณา</span><span>ค่าธรรมเนียม</span><span>ราคาสุทธิ</span><span>อัปเดต</span><span></span></div>
  {#each offers as offer}
    {@const store = storeFor(offer)}
    <div class="offer" class:best={offer.id === bestId}>
      <button class="row" aria-label={`รายละเอียด ${store.name}`} onclick={() => expanded = expanded === offer.id ? null : offer.id} aria-expanded={expanded === offer.id}>
        <span class="store"><StoreLogo initials={store.initials} type={store.type} size={30} /><span><strong>{store.name}</strong><small>{store.type === 'official' ? 'ร้านค้าอย่างเป็นทางการ' : store.type === 'marketplace' ? 'Marketplace' : 'ตัวแทนจำหน่ายคีย์'}</small></span></span>
        <span>Standard Edition<small>{offer.drm}</small></span>
        <span><i class="tag">{offer.region}</i><i class:tag-ok={offer.regionStatus === 'confirmed'} class:tag-warn={offer.regionStatus !== 'confirmed'} class="tag">{offer.regionStatus === 'confirmed' ? 'ใช้งานในไทยได้' : 'ตรวจสอบภูมิภาค'}</i></span>
        <span><s>{formatBaht(offer.advertisedSatang)}</s></span><span>{offer.feeSatang ? `+ ${formatBaht(offer.feeSatang)}` : '—'}</span>
        <span class="final">{formatBaht(offer.finalSatang)}<small>−{discountPercent(offer)}%</small></span><span>{formatRelativeMinutes(offer.updatedMinutesAgo)}</span><span class="chev">{expanded === offer.id ? '⌃' : '⌄'}</span>
      </button>
      {#if expanded === offer.id}<div class="detail"><section><h4>รายละเอียดราคา</h4><p><span>ราคาที่โฆษณา</span><b>{formatBaht(offer.advertisedSatang)}</b></p><p><span>ค่าธรรมเนียม</span><b>{offer.feeSatang ? formatBaht(offer.feeSatang) : 'ไม่มี'}</b></p><p class="ok"><span>ราคาสุทธิ</span><b>{formatBaht(offer.finalSatang)}</b></p></section><section><h4>ผู้ขายและความน่าเชื่อถือ</h4><p><span>ประเภทร้าน</span><b>{store.type}</b></p><p><span>การชำระเงิน</span><b>{store.payments.slice(0,2).join(' · ')}</b></p></section><section><h4>ข้อควรทราบ</h4><p>{store.note}</p><button class="btn btn-accent" disabled={!offer.inStock} onclick={() => onbuy(offer)}>{offer.inStock ? 'ไปยังร้านค้า ↗' : 'สินค้าหมด'}</button></section></div>{/if}
    </div>
  {/each}
</div>

<style>
  .table{min-width:1080px;overflow:hidden}.thead,.row{display:grid;grid-template-columns:186px 128px 150px 90px 90px 115px 82px 42px;gap:12px;align-items:center}.thead{padding:10px 16px;border-bottom:1px solid var(--line);background:var(--sunk);color:var(--mute2);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase}.offer{border-bottom:1px solid var(--line2)}.offer.best{border-left:2px solid var(--ok);background:linear-gradient(90deg,color-mix(in srgb,var(--ok) 8%,transparent),transparent 55%)}.row{width:100%;padding:13px 16px;border:0;background:transparent;color:var(--ink);cursor:pointer;text-align:left}.row:hover{background:rgb(233 233 237 / 3%)}.row>span{display:flex;flex-direction:column;gap:4px;font-size:12.5px}.row small{color:var(--mute2);font-size:10px}.row i{font-style:normal}.store{display:flex!important;align-items:center;flex-direction:row!important;gap:10px}.store>span{display:flex;min-width:0;flex-direction:column}.store strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.final{align-items:flex-end;color:var(--ok);font-size:17px!important;font-weight:700}.final small{padding:1px 6px;border-radius:6px;background:var(--ok-dim);color:var(--ok)}.chev{align-items:center}.detail{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin:0 16px 16px;padding:14px 16px;border:1px solid var(--line2);border-radius:11px;background:var(--sunk);animation:rise .15s}.detail h4{margin-bottom:8px;color:var(--mute2);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase}.detail p{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid var(--line2);font-size:12px}.detail .ok{color:var(--ok)}.detail section:last-child p{display:block;color:var(--mute);line-height:1.6}.detail button{margin-top:8px}
</style>
