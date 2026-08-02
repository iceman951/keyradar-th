<script lang="ts">
  import type { GameFilters } from '$lib/domain/models';
  let { filters = $bindable(), bare = false, onreset }: { filters: GameFilters; bare?: boolean; onreset?: () => void } = $props();
  const toggle = (key: 'thailandOnly' | 'officialOnly' | 'excludeMarketplace' | 'inStockOnly' | 'historicalLowOnly') => filters = { ...filters, [key]: !filters[key] };
  const rows = [
    ['thailandOnly', 'ใช้งานได้ในประเทศไทย', 'แสดงเฉพาะข้อเสนอที่ยืนยันภูมิภาคแล้ว'],
    ['officialOnly', 'เฉพาะร้านค้าอย่างเป็นทางการ', 'ตัวแทนจำหน่ายที่ได้รับอนุญาตเท่านั้น'],
    ['excludeMarketplace', 'ไม่รวม Marketplace', 'ตัดผู้ขายรายย่อยที่มีค่าธรรมเนียมเพิ่ม'],
    ['inStockOnly', 'มีสินค้าพร้อมส่ง', ''],
    ['historicalLowOnly', 'ราคาต่ำสุดเป็นประวัติการณ์', '']
  ] as const;
</script>

<section class="panel" class:bare>
  {#if !bare}<div class="head"><strong>☷ ตัวกรอง</strong><button onclick={onreset}>ล้างทั้งหมด</button></div>{/if}
  <label class="range"><span>ช่วงราคา <b>ไม่เกิน ฿{Math.round(filters.maxPriceSatang / 100).toLocaleString('th-TH')}</b></span><input aria-label="ราคาสูงสุด" type="range" min="9900" max="240000" step="5000" bind:value={filters.maxPriceSatang} /><small><i>฿99</i><i>฿2,400+</i></small></label>
  <label class="range"><span>ส่วนลดขั้นต่ำ <b>{filters.minDiscountPercent ? `ตั้งแต่ ${filters.minDiscountPercent}%` : 'ทั้งหมด'}</b></span><input aria-label="ส่วนลดขั้นต่ำ" type="range" min="0" max="80" step="5" bind:value={filters.minDiscountPercent} /></label>
  <div class="checks">
    {#each rows as row}
      <label class:active={filters[row[0]]}><input type="checkbox" checked={filters[row[0]]} onchange={() => toggle(row[0])} /><span>{row[1]}{#if row[2]}<small>{row[2]}</small>{/if}</span></label>
    {/each}
  </div>
  <div class="editions"><span>EDITION</span><div>{#each ['Standard','Deluxe','Complete','DLC','Bundle'] as name}<button class:active={name === 'Standard'}>{name}</button>{/each}</div></div>
</section>

<style>
  .panel{display:flex;flex-direction:column;gap:16px;padding:14px;border:1px solid var(--line);border-radius:14px;background:color-mix(in srgb,var(--ink) 2.5%,transparent)}.panel.bare{padding:0;border:0;background:transparent}.head{display:flex;justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--line2)}.head button{border:0;background:transparent;color:var(--color-accent);font-size:11.5px;cursor:pointer}.range{display:flex;flex-direction:column;gap:9px}.range>span{display:flex;justify-content:space-between;color:var(--mute2);font-size:11px;letter-spacing:.08em;text-transform:uppercase}.range b{color:var(--ink);font-size:12.5px;letter-spacing:0;text-transform:none}.range input{width:100%;accent-color:var(--color-accent)}.range small{display:flex;justify-content:space-between;color:var(--mute2)}.range i{font-style:normal}.checks{display:flex;flex-direction:column;gap:4px;padding-top:12px;border-top:1px solid var(--line2)}.checks label{display:flex;align-items:flex-start;gap:9px;padding:6px;border-radius:9px;cursor:pointer}.checks label.active{background:color-mix(in srgb,var(--color-accent) 9%,transparent)}.checks input{width:15px;height:15px;accent-color:var(--color-accent)}.checks span{display:flex;flex-direction:column;font-size:13px}.checks small{color:var(--mute2);font-size:11px}.editions{padding-top:12px;border-top:1px solid var(--line2)}.editions>span{color:var(--mute2);font-size:11px;letter-spacing:.08em}.editions div{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.editions button{padding:4px 10px;border:1px solid var(--line);border-radius:999px;background:transparent;color:var(--mute);font-size:11.5px}.editions button.active{border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 12%,transparent);color:var(--color-accent-200)}
</style>
