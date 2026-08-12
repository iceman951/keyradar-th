<script lang="ts">
  import type { Store } from '$lib/domain/models'
  import { storeTypeLabel } from '$lib/domain/presentation'
  import StoreLogo from '$lib/components/ui/StoreLogo.svelte'
  import Icon from '$lib/components/ui/Icon.svelte'
  let { store }: { store: Store } = $props()
  const typeLabel = $derived(storeTypeLabel(store.type))
  const commonRegion = $derived(
    store.id === 'gamesplanet'
      ? 'ยุโรป (EU) เป็นหลัก'
      : store.type === 'steam'
        ? 'ไทย'
        : 'Global / SEA'
  )
</script>

<article class="card surface">
  <header>
    <StoreLogo initials={store.initials} type={store.type} size={42} /><span
      ><h2>{store.name}</h2>
      <i>{typeLabel}</i></span
    >
  </header>
  <div class="rows">
    <p><span>สถานะ</span><b>{typeLabel}</b></p>
    <p><span>ภูมิภาคที่พบบ่อย</span><b>{commonRegion}</b></p>
    <p>
      <span>ค่าธรรมเนียมเพิ่ม</span><b
        >{store.feeRate ? `มี — ${store.feeLabel}` : 'ไม่พบ'}</b
      >
    </p>
    <p><span>การชำระเงิน</span><b>{store.payments.join(' · ')}</b></p>
  </div>
  <p class="note">{store.note}</p>
  <a class="btn" href={`/deals?store=${encodeURIComponent(store.id)}`}
    >ดูดีลจากร้านนี้ <Icon name="arrowRight" size={13} /></a
  >
</article>

<style>
  .card {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 13px;
    padding: 15px;
  }
  .card header {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .card header span {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
  }
  .card h2 {
    font-size: 15.5px;
  }
  .card i {
    color: var(--mute);
    font-size: 10px;
    font-style: normal;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .rows p {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 7px;
    border-bottom: 1px solid var(--line2);
    font-size: 12px;
  }
  .rows span {
    color: var(--mute);
    white-space: nowrap;
  }
  .rows b {
    max-width: 62%;
    font-weight: 400;
    text-align: right;
  }
  .note {
    flex: 1;
    color: var(--mute2);
    font-size: 11.5px;
    line-height: 1.65;
  }
  .card > a {
    min-height: 40px;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
  }
  @media (max-width: 779px) {
    .card > a {
      min-height: 44px;
    }
  }
</style>
