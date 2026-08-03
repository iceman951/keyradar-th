<script lang="ts">
  import type { EditionCategory, GameFilters } from '$lib/domain/models';
  import Icon from '$lib/components/ui/Icon.svelte';

  type ToggleKey =
    | 'thailandOnly'
    | 'steamOnly'
    | 'officialOnly'
    | 'excludeMarketplace'
    | 'inStockOnly'
    | 'historicalLowOnly'
    | 'noAdditionalFeeOnly';

  let {
    filters = $bindable(),
    bare = false,
    onreset
  }: { filters: GameFilters; bare?: boolean; onreset?: () => void } = $props();

  const toggle = (key: ToggleKey) => { filters = { ...filters, [key]: !filters[key] }; };
  const setEdition = (editionCategory: EditionCategory | 'all') => { filters = { ...filters, editionCategory }; };

  const groups: { heading: string; items: readonly [ToggleKey, string, string][] }[] = [
    {
      heading: 'การเปิดใช้งาน',
      items: [
        ['thailandOnly', 'ใช้งานได้ในประเทศไทย', 'แสดงเฉพาะข้อเสนอที่ยืนยันภูมิภาคแล้ว'],
        ['steamOnly', 'เปิดใช้งานผ่าน Steam', 'ไม่รวมคีย์ Epic / Ubisoft / EA App']
      ]
    },
    {
      heading: 'ประเภทร้านค้า',
      items: [
        ['officialOnly', 'เฉพาะร้านค้าอย่างเป็นทางการ', 'ตัวแทนจำหน่ายที่ได้รับอนุญาตเท่านั้น'],
        ['excludeMarketplace', 'ไม่รวม Marketplace', 'ตัดผู้ขายรายย่อยที่มีค่าธรรมเนียมเพิ่ม']
      ]
    },
    {
      heading: 'สถานะข้อเสนอ',
      items: [
        ['inStockOnly', 'มีสินค้าพร้อมส่ง', ''],
        ['historicalLowOnly', 'ราคาต่ำสุดเป็นประวัติการณ์', ''],
        ['noAdditionalFeeOnly', 'ไม่มีค่าธรรมเนียมเพิ่มเติม', '']
      ]
    }
  ];

  const editions: readonly [EditionCategory | 'all', string][] = [
    ['all', 'ทั้งหมด'],
    ['standard', 'Standard'],
    ['deluxe', 'Deluxe'],
    ['complete', 'Complete'],
    ['dlc', 'DLC'],
    ['bundle', 'Bundle']
  ];
</script>

<section class="panel" class:bare aria-label="ตัวกรองราคาเกม">
  {#if !bare}
    <div class="head">
      <strong><Icon name="sliders" size={15} />ตัวกรอง</strong>
      <button type="button" onclick={onreset}>ล้างทั้งหมด</button>
    </div>
  {/if}

  <label class="range">
    <span>ช่วงราคา <b>ไม่เกิน ฿{Math.round(filters.maxPriceSatang / 100).toLocaleString('th-TH')}</b></span>
    <input aria-label="ราคาสูงสุด" type="range" min="9900" max="240000" step="5000" bind:value={filters.maxPriceSatang} />
    <small><i>฿99</i><i>฿2,400+</i></small>
  </label>

  <label class="range">
    <span>ส่วนลดขั้นต่ำ <b>{filters.minDiscountPercent ? `ตั้งแต่ ${filters.minDiscountPercent}%` : 'ทั้งหมด'}</b></span>
    <input aria-label="ส่วนลดขั้นต่ำ" type="range" min="0" max="80" step="5" bind:value={filters.minDiscountPercent} />
  </label>

  {#each groups as group}
    <fieldset class="checks">
      <legend>{group.heading}</legend>
      {#each group.items as row}
        <label class:active={filters[row[0]]}>
          <input type="checkbox" checked={filters[row[0]]} onchange={() => toggle(row[0])} />
          <span>{row[1]}{#if row[2]}<small>{row[2]}</small>{/if}</span>
        </label>
      {/each}
    </fieldset>
  {/each}

  <fieldset class="editions">
    <legend>Edition</legend>
    <div>
      {#each editions as edition}
        <button
          type="button"
          class:active={filters.editionCategory === edition[0]}
          aria-pressed={filters.editionCategory === edition[0]}
          onclick={() => setEdition(edition[0])}
        >{edition[1]}</button>
      {/each}
    </div>
  </fieldset>
</section>

<style>
  .panel{display:flex;flex-direction:column;gap:16px;padding:14px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--ink) 2.5%,transparent)}
  .panel.bare{padding:0;border:0;background:transparent}
  .head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-bottom:12px;border-bottom:1px solid var(--line2)}
  .head strong{display:inline-flex;align-items:center;gap:7px;font-size:13.5px}
  .head button{padding:2px;border:0;background:transparent;color:var(--color-accent);font-size:11.5px;cursor:pointer}
  .range{display:flex;flex-direction:column;gap:9px}
  .range>span{display:flex;align-items:baseline;justify-content:space-between;gap:8px;color:var(--mute2);font-size:11px;letter-spacing:.09em;text-transform:uppercase}
  .range b{color:var(--ink);font-size:12.5px;letter-spacing:0;text-transform:none}
  .range input{width:100%;accent-color:var(--color-accent)}
  .range small{display:flex;justify-content:space-between;color:var(--mute2);font-size:10.5px}
  .range i{font-style:normal}
  fieldset{min-width:0;margin:0;padding:0;border:0}
  fieldset legend{width:100%;margin-bottom:8px;color:var(--mute2);font-size:11px;letter-spacing:.09em;text-transform:uppercase}
  .checks{display:flex;flex-direction:column;gap:4px;padding-top:12px;border-top:1px solid var(--line2)}
  .checks label{display:flex;align-items:flex-start;gap:9px;margin-inline:-6px;padding:4px 6px;border-radius:9px;cursor:pointer;user-select:none}
  .checks label.active{background:color-mix(in srgb,var(--color-accent) 9%,transparent)}
  .checks input{width:15px;height:15px;flex:none;margin-top:2px;accent-color:var(--color-accent)}
  .checks span{display:flex;min-width:0;flex-direction:column;gap:2px;font-size:13px}
  .checks small{color:var(--mute2);font-size:11px;line-height:1.5}
  .editions{padding-top:12px;border-top:1px solid var(--line2)}
  .editions div{display:flex;gap:6px;flex-wrap:wrap}
  .editions button{min-height:28px;padding:4px 10px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--mute);font-size:11.5px;cursor:pointer}
  .editions button.active{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 12%,transparent);color:var(--color-accent-200)}
  .bare .checks label{min-height:44px;margin:0;padding:9px 8px}
  .bare .editions button{min-height:40px;padding-inline:13px}
</style>
