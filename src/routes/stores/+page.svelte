<script lang="ts">
  import StoreCard from '$lib/components/stores/StoreCard.svelte'
  import { gameRepository } from '$lib/data/repository'
  import { sortStoresByTrust } from '$lib/domain/stores'
  import type { Store } from '$lib/domain/models'
  let stores = $state<Store[]>([])
  $effect(() => {
    gameRepository
      .listStores()
      .then((value) => (stores = sortStoresByTrust(value)))
  })
</script>

<svelte:head><title>ร้านค้าที่รองรับ — KeyRadar TH</title></svelte:head>
<main class="page">
  <h1>ร้านค้าที่รองรับ</h1>
  <p class="lead">
    เราแสดงเฉพาะร้านที่ได้รับอนุญาตและมีข้อมูลราคาจริงเท่านั้น
    และไม่ได้ถือว่าทุกร้านน่าเชื่อถือเท่ากัน
    โปรดอ่านเงื่อนไขภูมิภาคและค่าธรรมเนียมก่อนซื้อ
  </p>
  <div class="legend">
    <article>
      <i class="ok"></i><span
        ><b>ร้านค้าอย่างเป็นทางการ</b><small
          >ได้รับสิทธิ์จำหน่ายคีย์จากผู้จัดจำหน่ายโดยตรง</small
        ></span
      >
    </article>
    <article>
      <i class="warn"></i><span
        ><b>ตัวแทนจำหน่ายคีย์</b><small
          >ซื้อคีย์จำนวนมากมาขายต่อ ไม่ใช่ตัวแทนอย่างเป็นทางการทุกเกม</small
        ></span
      >
    </article>
    <article>
      <i></i><span
        ><b>Marketplace</b><small
          >ผู้ขายรายย่อยเป็นผู้ตั้งราคาและกำหนดภูมิภาคเอง มีค่าธรรมเนียมเพิ่ม</small
        ></span
      >
    </article>
  </div>
  <div class="cards">
    {#each stores as store}<StoreCard {store} />{/each}
  </div>
</main>

<style>
  h1 {
    font-size: 27px;
  }
  .lead {
    max-width: 680px;
    margin: 6px 0 8px;
    color: var(--mute);
    font-size: 13px;
  }
  .legend {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    margin: 16px 0 24px;
  }
  .legend article {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    min-width: 220px;
    flex: 1;
    padding: 11px 13px;
    border: 1px solid var(--line);
    border-radius: 11px;
  }
  .legend i {
    width: 11px;
    height: 11px;
    flex: none;
    margin-top: 4px;
    border-radius: 3px;
    background: #8b90ab;
  }
  .legend i.ok {
    background: var(--ok);
  }
  .legend i.warn {
    background: var(--warn);
  }
  .legend span {
    display: flex;
    flex-direction: column;
  }
  .legend small {
    color: var(--mute);
    font-size: 11.5px;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  @media (max-width: 1179px) {
    .cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 779px) {
    h1 {
      font-size: 21px;
    }
    .cards {
      grid-template-columns: 1fr;
    }
  }
</style>
