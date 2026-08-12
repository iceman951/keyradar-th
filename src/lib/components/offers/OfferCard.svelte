<script lang="ts">
  import type { Offer, Store } from '$lib/domain/models'
  import { discountPercent, offerFeeTotal } from '$lib/domain/pricing'
  import {
    regionPresentation,
    regionStatusLabel,
    storeTypeLabel
  } from '$lib/domain/presentation'
  import { formatBaht } from '$lib/utils/currency'
  import { formatRelativeMinutes } from '$lib/utils/date'
  import Icon from '$lib/components/ui/Icon.svelte'
  import StoreLogo from '$lib/components/ui/StoreLogo.svelte'

  let {
    offer,
    store,
    best = false,
    expanded = $bindable(false),
    onbuy
  }: {
    offer: Offer
    store: Store
    best?: boolean
    expanded?: boolean
    onbuy: (offer: Offer) => void
  } = $props()

  const feeTotal = $derived(offerFeeTotal(offer))
  const region = $derived(regionPresentation(offer.region))
  const isConfirmedBest = $derived(
    best && offer.regionStatus === 'confirmed' && offer.inStock
  )
  const detailId = $derived(`offer-card-detail-${offer.id}`)
</script>

<article
  class="card surface"
  class:best={isConfirmedBest}
  class:blocked={offer.regionStatus === 'blocked'}
  data-testid="offer-card"
>
  {#if isConfirmedBest}<div class="bestbar">
      <Icon name="check" size={12} />ถูกที่สุดที่ใช้งานในไทยได้
    </div>{/if}
  <div class="body">
    <div class="store">
      <StoreLogo initials={store.initials} type={store.type} size={38} />
      <span
        ><strong>{store.name}</strong><small>{storeTypeLabel(store.type)}</small
        ></span
      >
      <time datetime={`PT${offer.updatedMinutesAgo}M`}
        >{formatRelativeMinutes(offer.updatedMinutesAgo)}</time
      >
    </div>

    <div class="price">
      <span
        ><small>ราคาสุทธิโดยประมาณ</small><strong
          class:confirmed-best={isConfirmedBest}
          >{formatBaht(offer.finalSatang)}</strong
        ><em
          >โฆษณา <s>{formatBaht(offer.advertisedSatang)}</s> · ค่าธรรมเนียม {feeTotal
            ? `+ ${formatBaht(feeTotal)}`
            : 'ไม่มี'}</em
        ></span
      >
      {#if discountPercent(offer)}<b class:confirmed-best={isConfirmedBest}
          >−{discountPercent(offer)}%</b
        >{/if}
    </div>

    <div class="tags">
      <span
        class="tag"
        class:tag-warn={offer.regionStatus === 'uncertain'}
        class:tag-bad={offer.regionStatus === 'blocked'}>{region.label}</span
      >
      <span
        class="tag"
        class:tag-ok={offer.regionStatus === 'confirmed'}
        class:tag-warn={offer.regionStatus === 'uncertain'}
        class:tag-bad={offer.regionStatus === 'blocked'}
      >
        {#if offer.regionStatus === 'confirmed'}<Icon
            name="check"
            size={10}
          />{:else if offer.regionStatus === 'blocked'}<Icon
            name="x"
            size={10}
          />{:else}<Icon name="warning" size={10} />{/if}
        {regionStatusLabel(offer.regionStatus)}
      </span>
      <span class="tag">{offer.drm}</span><span class="tag"
        >{offer.editionName}</span
      >
      {#if offer.isHistoricalLow}<span class="tag historical"
          >ต่ำสุดเป็นประวัติการณ์</span
        >{/if}
    </div>

    {#if expanded}
      <div class="details" id={detailId}>
        <section>
          <h4>รายละเอียดราคา</h4>
          <p>
            <span>ราคาที่โฆษณา</span><b>{formatBaht(offer.advertisedSatang)}</b>
          </p>
          {#each offer.fees as fee}<p>
              <span>{fee.label}</span><b>+ {formatBaht(fee.amountSatang)}</b>
            </p>{/each}
          {#if !offer.fees.length}<p>
              <span>ค่าธรรมเนียมที่ทราบ</span><b>ไม่มี</b>
            </p>{/if}
          <p class="total" class:confirmed-best={isConfirmedBest}>
            <span>ราคาสุทธิโดยประมาณ</span><b>{formatBaht(offer.finalSatang)}</b
            >
          </p>
        </section>
        <section>
          <h4>ผู้ขายและความน่าเชื่อถือ</h4>
          {#if offer.sellerRating !== undefined}<p>
              <span>คะแนนผู้ขาย</span><b>{offer.sellerRating.toFixed(1)}%</b>
            </p>{/if}
          {#if offer.sellerReviewCount !== undefined}<p>
              <span>จำนวนรีวิวผู้ขาย</span><b
                >{offer.sellerReviewCount.toLocaleString('th-TH')}</b
              >
            </p>{/if}
          <p><span>ประเภทร้าน</span><b>{storeTypeLabel(store.type)}</b></p>
          <p>
            <span>การชำระเงิน</span><b
              >{store.payments.slice(0, 2).join(' · ')}</b
            >
          </p>
        </section>
        <section
          class="notice"
          class:uncertain={offer.regionStatus === 'uncertain'}
          class:blocked={offer.regionStatus === 'blocked'}
        >
          <h4>ข้อควรทราบ</h4>
          <p>{region.description}</p>
          <p>{store.note}</p>
        </section>
      </div>
    {/if}

    <div class="actions">
      <button
        class="btn"
        type="button"
        aria-expanded={expanded}
        aria-controls={detailId}
        onclick={() => {
          expanded = !expanded
        }}
      >
        {expanded ? 'ซ่อนรายละเอียด' : 'รายละเอียด'}
        <Icon class={expanded ? 'open' : ''} name="chevronDown" size={14} />
      </button>
      {#if offer.inStock}
        <button
          class="btn buy"
          class:best={isConfirmedBest}
          class:blocked={offer.regionStatus === 'blocked'}
          type="button"
          onclick={() => onbuy(offer)}
          >ไปยังร้านค้า <Icon name="external" size={14} /></button
        >
      {:else}<span class="oos">สินค้าหมด</span>{/if}
    </div>
  </div>
</article>

<style>
  .card {
    overflow: hidden;
  }
  .card.best {
    border-color: var(--ok-line);
  }
  .card.blocked {
    border-color: color-mix(in srgb, var(--bad-line) 70%, var(--line));
  }
  .bestbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 13px;
    background: var(--ok-dim);
    color: var(--ok);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 13px;
  }
  .store {
    display: flex;
    align-items: center;
    gap: 11px;
  }
  .store > span {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
  }
  .store small {
    color: var(--mute2);
  }
  time {
    padding-top: 3px;
    color: var(--mute2);
    font-size: 10.5px;
    white-space: nowrap;
  }
  .price {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }
  .price > span {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
  }
  .price small {
    color: var(--mute2);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .price strong {
    color: var(--ink);
    font-size: 25px;
    letter-spacing: -0.02em;
  }
  .price strong.confirmed-best {
    color: var(--ok);
  }
  .price em {
    color: var(--mute);
    font-size: 11.5px;
    font-style: normal;
  }
  .price > b {
    padding: 4px 10px;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: #2b2e3f;
    color: #cfd3e5;
  }
  .price > b.confirmed-best {
    border-color: var(--ok-line);
    background: var(--ok-dim);
    color: var(--ok);
  }
  .tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .historical {
    border-color: color-mix(in srgb, var(--color-accent) 34%, transparent);
    background: var(--color-accent-900);
    color: var(--color-accent-200);
  }
  .details {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 12px;
    border: 1px solid var(--line2);
    border-radius: 11px;
    background: var(--sunk);
    animation: rise 0.16s;
  }
  .details h4 {
    margin: 0 0 7px;
    color: var(--mute2);
    font-size: 10px;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
  .details section > p {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 5px 0;
    border-bottom: 1px solid var(--line2);
    font-size: 12px;
  }
  .details section > p b {
    font-weight: 500;
    text-align: right;
  }
  .details .total {
    color: var(--ink);
    font-weight: 700;
  }
  .details .total.confirmed-best {
    color: var(--ok);
  }
  .details .notice {
    padding: 10px 11px;
    border: 1px solid var(--line2);
    border-radius: 9px;
  }
  .details .notice p {
    display: block;
    padding: 0;
    border: 0;
    color: var(--mute);
    line-height: 1.65;
  }
  .details .notice p + p {
    margin-top: 6px;
  }
  .details .notice.uncertain {
    border-color: var(--warn-line);
    background: var(--warn-dim);
  }
  .details .notice.uncertain p {
    color: var(--warn);
  }
  .details .notice.blocked {
    border-color: var(--bad-line);
    background: var(--bad-dim);
  }
  .details .notice.blocked p {
    color: var(--bad);
  }
  .actions {
    display: flex;
    align-items: stretch;
    gap: 8px;
  }
  .actions > * {
    min-height: 46px;
    flex: 1;
  }
  .actions button {
    gap: 6px;
  }
  .actions :global(svg.open) {
    transform: rotate(180deg);
  }
  .buy {
    flex: 1.6;
    border-color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 13%, transparent);
    color: var(--color-accent-200);
    font-weight: 600;
  }
  .buy.best {
    border-color: var(--ok-line);
    background: var(--ok-dim);
    color: var(--ok);
  }
  .buy.blocked {
    border-color: var(--bad-line);
    background: var(--bad-dim);
    color: var(--bad);
  }
  .oos {
    display: grid;
    place-items: center;
    flex: 1.6;
    border: 1px solid var(--bad-line);
    border-radius: 11px;
    background: var(--bad-dim);
    color: var(--bad);
    font-weight: 600;
  }
</style>
