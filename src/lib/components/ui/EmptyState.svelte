<script lang="ts">
  type Kind = 'no-results' | 'no-th' | 'no-price' | 'no-deals' | 'store-down';
  let { kind = 'no-results', query = '', action }: { kind?: Kind; query?: string; action?: () => void } = $props();
  const content = $derived({
    'no-results': [`ไม่พบเกมที่ตรงกับ “${query}”`, 'ลองพิมพ์ชื่อเกมเป็นภาษาอังกฤษ ตัดคำต่อท้ายอย่าง Edition หรือ Bundle ออก หรือลองเลือกเกมยอดนิยม', 'กลับไปหน้าแรก', '⌕'],
    'no-th': ['ยังไม่พบข้อเสนอที่ยืนยันว่าเปิดใช้งานในประเทศไทยได้', `ข้อเสนอทั้งหมดของ ${query} ที่พบเป็นคีย์ล็อกภูมิภาคอื่นหรือยังระบุภูมิภาคไม่ชัดเจน`, 'ดูข้อเสนอทั้งหมดพร้อมคำเตือน', '!'],
    'no-price': ['ยังไม่มีข้อมูลราคาสำหรับเกมนี้', 'ร้านค้าปลายทางอาจไม่ตอบสนองชั่วคราว ลองรีเฟรชอีกครั้งในอีกสักครู่', 'ลองดึงราคาอีกครั้ง', '↻'],
    'no-deals': ['ไม่มีดีลในหมวดนี้ตอนนี้', 'เงื่อนไขที่เลือกยังไม่ตรงกับดีลที่กำลังใช้งานอยู่ ลองเลือกหมวดอื่น', 'ดูดีลแนะนำ', '▥'],
    'store-down': ['ร้านค้านี้ไม่ตอบสนองชั่วคราว', 'ราคาที่แสดงเป็นข้อมูลจากการดึงครั้งก่อนและอาจไม่ใช่ราคาปัจจุบัน', 'ลองอีกครั้ง', '!']
  }[kind]);
</script>

<section class="empty surface" data-testid="empty-state">
  <span class="icon">{content[3]}</span><h2>{content[0]}</h2><p>{content[1]}</p>
  {#if kind === 'no-results'}<div class="tips"><span>Elden Ring</span><span>Valheim</span><span>Palworld</span></div>{/if}
  {#if action}<button class="btn btn-accent" onclick={action}>{content[2]}</button>{/if}
</section>

<style>
  .empty{display:flex;align-items:center;flex-direction:column;gap:11px;padding:44px 22px;border-style:dashed;text-align:center}.icon{width:52px;height:52px;display:grid;place-items:center;border:1px solid #3a3d52;border-radius:15px;background:#2b2e3f;color:var(--color-neutral-500);font-size:24px}.empty h2{font-size:18px}.empty p{max-width:460px;color:var(--mute);font-size:13px;line-height:1.7}.tips{display:flex;gap:7px;flex-wrap:wrap}.tips span{padding:4px 10px;border:1px solid var(--line);border-radius:999px;color:var(--mute);font-size:11.5px}.empty button{margin-top:5px}
</style>
