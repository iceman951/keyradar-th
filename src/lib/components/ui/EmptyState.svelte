<script lang="ts">
  import type { EmptyStateKind } from '$lib/domain/models';
  import Icon, { type IconName } from './Icon.svelte';

  type EmptyContent = {
    title: string;
    body: string;
    cta: string;
    icon: IconName;
    tone: 'neutral' | 'warning' | 'error';
    tips?: string[];
  };

  let {
    kind = 'no-results',
    query = '',
    action
  }: { kind?: EmptyStateKind; query?: string; action?: () => void } = $props();

  const content = $derived.by((): EmptyContent => ({
    'no-results': {
      title: query ? `ไม่พบเกมที่ตรงกับ “${query}”` : 'ไม่พบเกมที่ตรงกับคำค้นหา',
      body: 'ลองพิมพ์ชื่อเกมเป็นภาษาอังกฤษ ตัดคำต่อท้ายอย่าง Edition หรือ Bundle ออก หรือเลือกจากเกมยอดนิยมด้านล่าง',
      cta: 'กลับไปหน้าแรก',
      icon: 'search',
      tone: 'neutral',
      tips: ['Elden Ring', 'Valheim', 'Palworld']
    },
    'no-th': {
      title: 'ยังไม่พบข้อเสนอที่ยืนยันว่าเปิดใช้งานในประเทศไทยได้',
      body: `ข้อเสนอทั้งหมดของ ${query || 'เกมนี้'} ที่เรารวบรวมได้ตอนนี้เป็นคีย์ล็อกภูมิภาคอื่น หรือผู้ขายยังไม่ได้ระบุภูมิภาคอย่างชัดเจน เราไม่แนะนำให้ซื้อจนกว่าจะตรวจสอบกับร้านค้าโดยตรง`,
      cta: 'ดูข้อเสนอทั้งหมดพร้อมคำเตือน',
      icon: 'warning',
      tone: 'error'
    },
    'no-price': {
      title: 'ยังไม่มีข้อมูลราคาสำหรับเกมนี้',
      body: 'เรายังดึงราคาจากร้านค้าไม่สำเร็จ อาจเป็นเพราะร้านค้าปลายทางไม่ตอบสนองชั่วคราว ลองรีเฟรชอีกครั้งในอีกสักครู่',
      cta: 'ลองดึงราคาอีกครั้ง',
      icon: 'refresh',
      tone: 'warning'
    },
    'no-deals': {
      title: 'ไม่มีดีลในหมวดนี้ตอนนี้',
      body: 'เงื่อนไขที่เลือกยังไม่ตรงกับดีลที่กำลังใช้งานอยู่ ลองเลือกหมวดอื่นหรือกลับไปดูดีลแนะนำ',
      cta: 'ดูดีลแนะนำ',
      icon: 'chart',
      tone: 'neutral'
    },
    'store-down': {
      title: 'ร้านค้านี้ไม่ตอบสนองชั่วคราว',
      body: 'เราไม่สามารถยืนยันราคาและสต็อกล่าสุดจากร้านนี้ได้ ราคาที่แสดงเป็นข้อมูลจากการดึงครั้งก่อน',
      cta: 'ลองอีกครั้ง',
      icon: 'warning',
      tone: 'warning'
    }
  } satisfies Record<EmptyStateKind, EmptyContent>)[kind]);
</script>

<section class="empty surface" data-testid="empty-state" aria-live="polite">
  <span class="icon" class:warning={content.tone === 'warning'} class:error={content.tone === 'error'}>
    <Icon name={content.icon} size={25} />
  </span>
  <h2>{content.title}</h2>
  <p>{content.body}</p>
  {#if content.tips}<div class="tips">{#each content.tips as tip}<span>{tip}</span>{/each}</div>{/if}
  {#if action}<button type="button" class="btn btn-accent" onclick={action}>{content.cta}</button>{/if}
</section>

<style>
  .empty{display:flex;align-items:center;flex-direction:column;gap:11px;padding:44px 22px;border-style:dashed;text-align:center}
  .icon{width:52px;height:52px;display:grid;place-items:center;margin-bottom:3px;border:1px solid #3a3d52;border-radius:15px;background:#2b2e3f;color:var(--color-neutral-500)}
  .icon.warning{border-color:var(--warn-line);background:var(--warn-dim);color:var(--warn)}
  .icon.error{border-color:var(--bad-line);background:var(--bad-dim);color:var(--bad)}
  .empty h2{font-size:18px;text-wrap:balance}
  .empty p{max-width:440px;color:var(--mute);font-size:13px;line-height:1.7;text-wrap:pretty}
  .tips{display:flex;justify-content:center;gap:7px;flex-wrap:wrap;margin-top:2px}
  .tips span{padding:4px 10px;border:1px solid var(--line);border-radius:999px;color:var(--mute);font-size:11.5px}
  .empty button{min-height:42px;margin-top:6px;padding-inline:20px}
  @media(max-width:520px){.empty{padding:36px 16px}.empty button{min-height:44px}}
</style>
