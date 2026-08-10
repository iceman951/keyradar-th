<script lang="ts">
  import type { Offer, Store } from '$lib/domain/models';
  import { discountPercent, offerFeeTotal } from '$lib/domain/pricing';
  import { regionPresentation, regionStatusLabel, storeTypeLabel } from '$lib/domain/presentation';
  import { formatBaht } from '$lib/utils/currency';
  import { formatRelativeMinutes } from '$lib/utils/date';
  import Icon from '$lib/components/ui/Icon.svelte';
  import StoreLogo from '$lib/components/ui/StoreLogo.svelte';

  let {
    offers,
    stores,
    bestId,
    onbuy
  }: { offers: Offer[]; stores: Store[]; bestId?: string; onbuy: (offer: Offer) => void } = $props();

  let expanded = $state<string | null>(null);
  const storeFor = (offer: Offer) => stores.find((store) => store.id === offer.storeId);
  const detailId = (offer: Offer) => `offer-table-detail-${offer.id}`;
</script>

<div class="table surface" role="table" aria-label="เปรียบเทียบราคาจากร้านค้า">
  <div class="thead" role="row">
    <span role="columnheader">ร้านค้า</span><span role="columnheader">Edition</span><span role="columnheader">ภูมิภาค / การเปิดใช้งาน</span><span role="columnheader">ราคาโฆษณา</span><span role="columnheader">ค่าธรรมเนียม</span><span role="columnheader">ราคาสุทธิโดยประมาณ</span><span role="columnheader">อัปเดต</span><span role="columnheader" aria-label="การทำงาน"></span>
  </div>
  {#each offers as offer}
    {@const store = storeFor(offer)}
    {@const region = regionPresentation(offer.region)}
    {@const feeTotal = offerFeeTotal(offer)}
    {@const isBest = offer.id === bestId && offer.regionStatus === 'confirmed' && offer.inStock}
    {#if store}
      <div class="offer" class:best={isBest} class:blocked={offer.regionStatus === 'blocked'} role="rowgroup">
        <div class="row" role="row">
          <span class="store" role="cell"><StoreLogo initials={store.initials} type={store.type} size={30} /><span><strong>{store.name}{#if isBest}<i class="tag tag-ok">ถูกที่สุด</i>{/if}</strong><small>{storeTypeLabel(store.type)}</small></span></span>
          <span role="cell"><strong>{offer.editionName}</strong><small>{offer.drm}</small></span>
          <span class="region" role="cell"><i class="tag" class:tag-warn={offer.regionStatus === 'uncertain'} class:tag-bad={offer.regionStatus === 'blocked'}>{region.label}</i><i class="tag" class:tag-ok={offer.regionStatus === 'confirmed'} class:tag-warn={offer.regionStatus === 'uncertain'} class:tag-bad={offer.regionStatus === 'blocked'}>{regionStatusLabel(offer.regionStatus)}</i>{#if offer.voucherCode}<i class="tag tag-warn">ต้องใช้โค้ด {offer.voucherCode}</i>{/if}</span>
          <span class="number advertised" role="cell"><s>{formatBaht(offer.advertisedSatang)}</s></span>
          <span class="number" role="cell">{feeTotal ? `+ ${formatBaht(feeTotal)}` : '—'}</span>
          <span class="number final" class:confirmed-best={isBest} role="cell"><strong title={offer.approximate ? `ร้านคิดราคาเป็น ${offer.sourceCurrency} — ยอดนี้แปลงเป็นบาทโดยประมาณ` : undefined}>{#if offer.approximate}<span class="approx" aria-label="ราคาโดยประมาณ">~</span>{/if}{formatBaht(offer.finalSatang)}</strong>{#if discountPercent(offer)}<small class:confirmed-best={isBest}>−{discountPercent(offer)}%</small>{/if}</span>
          <span class="updated" role="cell"><time datetime={`PT${offer.updatedMinutesAgo}M`}>{formatRelativeMinutes(offer.updatedMinutesAgo)}</time></span>
          <span class="row-actions" role="cell">
            {#if offer.inStock}<button type="button" class="buy" class:confirmed-best={isBest} class:blocked={offer.regionStatus === 'blocked'} onclick={() => onbuy(offer)}>ไปยังร้าน</button>{:else}<span class="oos">สินค้าหมด</span>{/if}
            <button type="button" class="toggle" aria-label={`${expanded === offer.id ? 'ซ่อน' : 'แสดง'}รายละเอียด ${store.name}`} aria-expanded={expanded === offer.id} aria-controls={detailId(offer)} onclick={() => { expanded = expanded === offer.id ? null : offer.id; }}><Icon class={expanded === offer.id ? 'open' : ''} name="chevronDown" size={14} /></button>
          </span>
        </div>

        {#if expanded === offer.id}
          <div class="detail" id={detailId(offer)} role="row">
            <section role="cell"><h4>รายละเอียดราคา</h4><p><span>ราคาที่โฆษณา</span><b>{formatBaht(offer.advertisedSatang)}</b></p>{#each offer.fees as fee}<p><span>{fee.label}</span><b>+ {formatBaht(fee.amountSatang)}</b></p>{/each}{#if !offer.fees.length}<p><span>ค่าธรรมเนียมที่ทราบ</span><b>ไม่มี</b></p>{/if}<p class="total" class:confirmed-best={isBest}><span>ราคาสุทธิโดยประมาณ</span><b>{formatBaht(offer.finalSatang)}</b></p></section>
            <section role="cell"><h4>ร้านค้าและการชำระเงิน</h4>{#if offer.sellerRating !== undefined}<p><span>คะแนนผู้ขาย</span><b>{offer.sellerRating.toFixed(1)}%</b></p>{/if}<p><span>ประเภทร้าน</span><b>{storeTypeLabel(store.type)}</b></p><p><span>สกุลเงินที่ร้านคิด</span><b>{offer.sourceCurrency ?? 'THB'}</b></p><p><span>การชำระเงิน</span><b>{store.payments.slice(0, 2).join(' · ')}</b></p></section>
            <section class="notice" class:uncertain={offer.regionStatus === 'uncertain'} class:blocked={offer.regionStatus === 'blocked'} role="cell"><h4>ข้อควรทราบ</h4><p>{region.description}</p><p>{store.note}</p></section>
          </div>
        {/if}
      </div>
    {/if}
  {/each}
</div>

<style>
  .table{min-width:1160px;overflow:hidden}.thead,.row{display:grid;grid-template-columns:195px 140px 165px 100px 100px 130px 86px minmax(124px,1fr);gap:12px;align-items:center}.thead{padding:10px 16px;border-bottom:1px solid var(--line);background:var(--sunk);color:var(--mute2);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase}.thead span:nth-child(n+4):nth-child(-n+7){text-align:right}.offer{border-bottom:1px solid var(--line2)}.offer.best{border-left:2px solid var(--ok);background:linear-gradient(90deg,color-mix(in srgb,var(--ok) 8%,transparent),transparent 55%)}.offer.blocked{border-left:2px solid var(--bad-line)}
  .row{padding:13px 16px;color:var(--ink)}.row:hover{background:rgb(233 233 237 / 3%)}.row>span{display:flex;min-width:0;flex-direction:column;gap:4px;font-size:12.5px}.row strong{font-weight:600}.row small,.row time{color:var(--mute2);font-size:10px}.row i{font-style:normal}.store{display:flex!important;align-items:center;flex-direction:row!important;gap:10px}.store>span{display:flex;min-width:0;flex-direction:column;gap:3px}.store strong{display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.store strong i{font-size:9px}.region{align-items:flex-start}.number{align-items:flex-end}.advertised{color:var(--mute)}.final strong{color:var(--ink);font-size:17px}.final.confirmed-best strong{color:var(--ok)}.final small{width:fit-content;padding:1px 6px;border:1px solid var(--line);border-radius:6px;background:#2b2e3f;color:#cfd3e5}.final small.confirmed-best{border-color:var(--ok-line);background:var(--ok-dim);color:var(--ok)}.final .approx{margin-right:1px;color:var(--mute2);font-size:13px;font-weight:500}.updated{align-items:flex-end}.updated time{white-space:nowrap}
  .row-actions{align-items:center!important;flex-direction:row!important;justify-content:flex-end;gap:6px!important}.row-actions button{cursor:pointer}.buy{min-height:32px;padding:0 9px;border:1px solid var(--color-accent);border-radius:8px;background:color-mix(in srgb,var(--color-accent) 13%,transparent);color:var(--color-accent-200);font-size:11.5px;font-weight:600}.buy.confirmed-best{border-color:var(--ok-line);background:var(--ok-dim);color:var(--ok)}.buy.blocked{border-color:var(--bad-line);background:var(--bad-dim);color:var(--bad)}.toggle{width:32px;height:32px;display:grid;place-items:center;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--mute)}.toggle:hover{border-color:var(--line);color:var(--ink)}.toggle :global(.open){transform:rotate(180deg)}.oos{display:inline-flex!important;align-items:center;padding:3px 7px;border:1px solid var(--bad-line);border-radius:7px;background:var(--bad-dim);color:var(--bad);font-size:10px!important;font-weight:600;white-space:nowrap}
  .detail{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin:0 16px 16px;padding:14px 16px;border:1px solid var(--line2);border-radius:11px;background:var(--sunk);animation:rise .15s}.detail h4{margin-bottom:8px;color:var(--mute2);font-size:10.5px;letter-spacing:.08em;text-transform:uppercase}.detail section>p{display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid var(--line2);font-size:12px}.detail section>p b{font-weight:500;text-align:right}.detail .total{font-weight:700}.detail .total.confirmed-best{color:var(--ok)}.detail .notice{padding:10px 11px;border:1px solid var(--line2);border-radius:9px}.detail .notice p{display:block;padding:0;border:0;color:var(--mute);line-height:1.6}.detail .notice p+p{margin-top:6px}.detail .notice.uncertain{border-color:var(--warn-line);background:var(--warn-dim)}.detail .notice.uncertain p{color:var(--warn)}.detail .notice.blocked{border-color:var(--bad-line);background:var(--bad-dim)}.detail .notice.blocked p{color:var(--bad)}
</style>
