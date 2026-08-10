<script lang="ts">
  import SearchBox from '$lib/components/search/SearchBox.svelte';
  import GameCard from '$lib/components/games/GameCard.svelte';
  import StoreLogo from '$lib/components/ui/StoreLogo.svelte';
  import Icon from '$lib/components/ui/Icon.svelte';
  import { gameRepository } from '$lib/data/repository';
  import { bestThaiOffer, discountPercent } from '$lib/domain/pricing';
  import { storeTypeLabel } from '$lib/domain/presentation';
  import { sortStoresByTrust } from '$lib/domain/stores';
  import type { Game, Offer, Store } from '$lib/domain/models';

  type CardEntry = { game: Game; offer: Offer; store: Store };

  let cards = $state<CardEntry[]>([]);
  let stores = $state<Store[]>([]);

  const popular = ['Valheim', 'Elden Ring', 'The Forest', 'Sons Of The Forest', 'Palworld', 'Cyberpunk 2077'];
  const trustPoints = [
    'ไม่มีค่าธรรมเนียมเพิ่มเติมจากเรา',
    'ไม่ต้องสมัครสมาชิก',
    'แสดงราคาสุทธิโดยประมาณเสมอ'
  ];
  const steps = [
    {
      icon: 'search' as const,
      title: 'ค้นหาเกม',
      body: 'พิมพ์ชื่อเกมที่ต้องการ ระบบจะจับคู่กับรายการบน Steam และแสดงราคาต่ำสุดทันทีในผลการค้นหา'
    },
    {
      icon: 'chart' as const,
      title: 'เปรียบเทียบราคาจากหลายร้าน',
      body: 'เราคำนวณราคาสุทธิโดยประมาณหลังรวมค่าธรรมเนียมที่ทราบ ไม่ใช่แค่ราคาที่โฆษณาไว้หน้าร้าน'
    },
    {
      icon: 'check' as const,
      title: 'เลือกร้านที่รองรับการเปิดใช้งานในไทย',
      body: 'ดูภูมิภาคของคีย์และประเภทร้านค้าก่อนตัดสินใจ แล้วกดไปยังร้านค้าเพื่อชำระเงินโดยตรง'
    }
  ];

  $effect(() => {
    void Promise.all([gameRepository.listGames(), gameRepository.listStores()]).then(
      async ([allGames, allStores]) => {
        const rankedStores = sortStoresByTrust(allStores);
        const storesById = new Map(allStores.map((store) => [store.id, store]));
        stores = rankedStores;

        const built = await Promise.all(
          allGames.map(async (game): Promise<CardEntry | null> => {
            const snapshot = await gameRepository.getOffers(game.slug);
            const offer = bestThaiOffer(snapshot.offers);
            const store = offer ? storesById.get(offer.storeId) : undefined;
            return offer && store ? { game, offer, store } : null;
          })
        );

        cards = built
          .filter((item): item is CardEntry => item !== null)
          .sort((a, b) => discountPercent(b.offer) - discountPercent(a.offer))
          .slice(0, 8);
      }
    );
  });
</script>

<svelte:head>
  <title>KeyRadar TH — ค้นหาราคาเกม Steam ที่ถูกที่สุดสำหรับคนไทย</title>
</svelte:head>

<main>
  <section class="hero">
    <div class="hero-decor" aria-hidden="true">
      <div class="radar"><i></i><i></i><i></i></div>
    </div>
    <div class="page hero-inner">
      <div class="live"><b><i></i> LIVE</b> ตรวจสอบราคาจาก {stores.length || '—'} ร้านค้า · อัปเดตทุก 8 ชั่วโมง</div>
      <h1>ค้นหาราคาเกม Steam<br /><span>ที่ถูกที่สุด</span> สำหรับคนไทย</h1>
      <p>
        เราเทียบ<strong>ราคาสุทธิหลังรวมค่าธรรมเนียม</strong> ไม่ใช่แค่ราคาที่โฆษณา
        และระบุชัดเจนว่าคีย์แต่ละใบเปิดใช้งานในประเทศไทยได้หรือไม่
      </p>
      <div class="hero-search"><SearchBox big /></div>
      <div class="popular">
        <span>ยอดค้นหา</span>
        {#each popular as name}<a href={`/search?q=${encodeURIComponent(name)}`}>{name}</a>{/each}
      </div>
      <div class="trust">
        {#each trustPoints as point}<span><Icon name="check" size={15} />{point}</span>{/each}
      </div>
    </div>
  </section>

  <section class="page">
    <header class="section-head">
      <div>
        <h2 class="section-title">เกมลดราคาน่าสนใจ</h2>
        <p>คัดเฉพาะดีลที่มีอย่างน้อยหนึ่งข้อเสนอที่ยืนยันว่าเปิดใช้งานในไทยได้</p>
      </div>
      <a class="btn" href="/deals">ดูทั้งหมด</a>
    </header>
    <div class="cards">{#each cards as card}<GameCard {...card} />{/each}</div>
  </section>

  <section class="page" id="how">
    <div class="how">
      <div class="intro">
        <h2 class="section-title">วิธีใช้งาน</h2>
        <p>KeyRadar TH ไม่ได้ขายเกมเอง เรารวบรวมราคาจากร้านค้าปลายทางแล้วคำนวณราคาสุทธิโดยประมาณให้เปรียบเทียบได้ในที่เดียว</p>
      </div>
      <div class="steps">
        {#each steps as step, index}
          <article class="surface">
            <div><b><Icon name={step.icon} size={17} /></b><small>ขั้นตอนที่ {index + 1}</small></div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        {/each}
      </div>
    </div>
  </section>

  <section class="page">
    <header class="section-head">
      <div>
        <h2 class="section-title">ร้านค้าที่รองรับ</h2>
        <p>เราแยกประเภทร้านค้าอย่างชัดเจน — ร้านค้าอย่างเป็นทางการไม่เหมือน Marketplace</p>
      </div>
      <a class="btn" href="/stores">รายละเอียดร้านค้า</a>
    </header>
    <div class="store-grid">
      {#each stores as store}
        <a class="surface" href="/stores">
          <StoreLogo initials={store.initials} type={store.type} />
          <span><b>{store.name}</b><small>{storeTypeLabel(store.type)}</small></span>
        </a>
      {/each}
    </div>
  </section>
</main>

<style>
  .hero { position: relative; }
  .hero-decor { position: absolute; inset: 0; overflow: clip; pointer-events: none; background: radial-gradient(120% 78% at 18% -18%, rgb(145 132 217 / 20%), transparent 62%), radial-gradient(80% 60% at 92% 8%, rgb(90 180 150 / 10%), transparent 60%); }
  .hero-inner { position: relative; max-width: 1320px; padding-top: 54px; }
  .hero-inner > * { max-width: 760px; }
  .live { width: fit-content; padding: 5px 12px 5px 6px; border: 1px solid var(--line); border-radius: 999px; background: rgb(233 233 237 / 4%); color: var(--mute); font-size: 11.5px; }
  .live b { padding: 2px 8px; border-radius: 999px; background: var(--ok-dim); color: var(--ok); font-size: 10.5px; }
  .live i { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--ok); }
  h1 { margin-top: 18px; font-size: clamp(30px, 5vw, 50px); line-height: 1.24; letter-spacing: -.032em; }
  h1 span { color: var(--color-accent-300); }
  .hero-inner > p { margin-top: 16px; color: var(--mute); font-size: 15.5px; line-height: 1.7; }
  .hero-inner > p strong { color: var(--ink); }
  .hero-search { position: relative; z-index: 5; isolation: isolate; margin-top: 30px; }
  .popular, .trust { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; margin-top: 18px; }
  .popular > span { color: var(--mute2); font-size: 11.5px; }
  .popular a { padding: 6px 12px; border: 1px solid var(--line); border-radius: 999px; background: rgb(233 233 237 / 3%); color: var(--ink); font-size: 12px; }
  .trust { gap: 22px; margin-top: 26px; color: var(--mute); font-size: 12px; }
  .trust span { display: inline-flex; align-items: center; gap: 7px; }
  .trust :global(svg) { color: var(--ok); }
  .radar { position: absolute; top: -140px; right: -90px; width: 460px; height: 460px; border: 1px solid rgb(145 132 217 / 20%); border-radius: 50%; opacity: .9; }
  .radar i { position: absolute; inset: 18%; border: 1px solid rgb(145 132 217 / 16%); border-radius: 50%; }
  .radar i:nth-child(2) { inset: 36%; }
  .radar i:nth-child(3) { inset: 48%; background: var(--color-accent); }
  .section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
  .section-head p { margin-top: 5px; color: var(--mute); font-size: 13px; }
  .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
  .how { display: flex; align-items: flex-start; gap: 34px; }
  .intro { max-width: 420px; }
  .intro p { margin-top: 10px; color: var(--mute); line-height: 1.7; }
  .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; flex: 1; }
  .steps article { padding: 18px; }
  .steps article > div { display: flex; align-items: center; gap: 11px; margin-bottom: 11px; }
  .steps b { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--color-accent) 32%, transparent); border-radius: 10px; background: var(--color-accent-900); color: var(--color-accent-300); }
  .steps small { color: var(--mute2); letter-spacing: .1em; }
  .steps h3 { font-size: 15.5px; }
  .steps p { margin-top: 6px; color: var(--mute); font-size: 12.5px; line-height: 1.65; }
  .store-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .store-grid a { display: flex; align-items: center; gap: 11px; padding: 12px; color: var(--ink); }
  .store-grid a > span { display: flex; min-width: 0; flex-direction: column; }
  .store-grid small { color: var(--mute); font-size: 9.5px; }

  @media (max-width: 1179px) {
    .cards { grid-template-columns: repeat(3, 1fr); }
    .how { flex-direction: column; }
    .store-grid { grid-template-columns: repeat(3, 1fr); }
  }

  @media (max-width: 779px) {
    .hero-inner { padding-top: 26px; }
    .hero-inner > p { font-size: 13.5px; }
    .hero-search { margin-top: 22px; }
    .radar { opacity: .5; }
    .cards { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .steps { grid-template-columns: 1fr; }
    .store-grid { grid-template-columns: repeat(2, 1fr); }
    .trust { gap: 10px; }
    .section-head { align-items: center; }
    .section-head .btn, .popular a { min-height: 44px; display: inline-flex; align-items: center; }
  }
</style>
