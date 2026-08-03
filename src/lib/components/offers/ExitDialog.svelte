<script lang="ts">
  import { tick } from 'svelte';
  import type { Game, Offer, Store } from '$lib/domain/models';
  import { offerFeeTotal } from '$lib/domain/pricing';
  import { regionPresentation, storeTypeLabel } from '$lib/domain/presentation';
  import { formatBaht } from '$lib/utils/currency';
  import Icon from '$lib/components/ui/Icon.svelte';

  let {
    offer,
    game,
    store,
    onclose
  }: { offer: Offer; game: Game; store: Store; onclose: () => void } = $props();

  let dialogElement: HTMLDivElement;
  const feeTotal = $derived(offerFeeTotal(offer));
  const region = $derived(regionPresentation(offer.region));
  const warning = $derived(offer.regionStatus === 'blocked'
    ? 'คีย์นี้เปิดใช้งานจากประเทศไทยไม่ได้ Steam จะปฏิเสธการเปิดใช้งาน โปรดเลือกข้อเสนอภูมิภาคอื่น'
    : offer.regionStatus === 'uncertain'
      ? 'ผู้ขายไม่ได้ระบุประเทศที่รองรับอย่างชัดเจน กรุณายืนยันภูมิภาคของคีย์กับร้านค้าก่อนชำระเงิน'
      : 'KeyRadar TH ไม่รับประกันผลการเปิดใช้งาน กรุณายืนยันภูมิภาคและราคาสุดท้ายบนหน้าร้านค้าอีกครั้งก่อนชำระเงิน');

  $effect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    void tick().then(() => dialogElement?.querySelector<HTMLElement>('button, a[href]')?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  });

  const focusableElements = () => Array.from(dialogElement.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ));

  const keydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onclose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = focusableElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
</script>

<svelte:window onkeydown={keydown} />

<div class="backdrop" role="presentation" onclick={(event) => { if (event.currentTarget === event.target) onclose(); }}>
  <div bind:this={dialogElement} class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description" tabindex="-1">
    <header>
      <span class="dialog-icon"><Icon name="external" size={18} /></span>
      <div><h2 id="dialog-title">คุณกำลังออกจาก KeyRadar TH</h2><p id="dialog-description">เรากำลังพาคุณไปที่ <strong>{store.name}</strong> เพื่อทำรายการซื้อ การชำระเงินและการรับคีย์ทั้งหมดเกิดขึ้นบนเว็บไซต์ของร้านค้า</p></div>
    </header>

    <div class="rows">
      <p><span>เกม</span><b>{game.title} · {offer.editionName}</b></p>
      <p><span>ราคาที่โฆษณา</span><b>{formatBaht(offer.advertisedSatang)}</b></p>
      <p><span>ค่าธรรมเนียมที่ทราบ</span><b>{feeTotal ? `+ ${formatBaht(feeTotal)}` : 'ไม่มี'}</b></p>
      <p class="total" class:confirmed={offer.regionStatus === 'confirmed'}><span>ราคาสุทธิโดยประมาณ</span><b>{formatBaht(offer.finalSatang)}</b></p>
      <p><span>ภูมิภาค / DRM</span><b>{region.label} · {offer.drm}</b></p>
      <p><span>ประเภทร้าน</span><b>{storeTypeLabel(store.type)}</b></p>
    </div>

    <div class="warning" class:uncertain={offer.regionStatus === 'uncertain'} class:blocked={offer.regionStatus === 'blocked'}><Icon name={offer.regionStatus === 'blocked' ? 'x' : 'warning'} size={15} /><span>{warning}</span></div>

    <footer>
      <button class="btn" type="button" onclick={onclose}>ยกเลิก</button>
      <a class="btn continue" class:confirmed={offer.regionStatus === 'confirmed'} class:blocked={offer.regionStatus === 'blocked'} href={offer.purchaseUrl} target="_blank" rel="noopener noreferrer" onclick={onclose}>ไปยัง {store.name} <Icon name="external" size={14} /></a>
    </footer>
  </div>
</div>

<style>
  .backdrop{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:18px;background:rgb(9 11 18 / 72%);backdrop-filter:blur(4px);animation:rise .16s}
  .dialog{width:min(430px,100%);max-height:min(680px,calc(100dvh - 36px));overflow:auto;display:flex;flex-direction:column;gap:14px;padding:18px;border:1px solid var(--line);border-radius:18px;background:var(--raise);box-shadow:0 28px 70px rgb(0 0 0 / 66%);animation:rise .18s}
  .dialog header{display:flex;align-items:flex-start;gap:12px}.dialog-icon{width:38px;height:38px;display:grid;place-items:center;flex:none;border:1px solid color-mix(in srgb,var(--color-accent) 30%,transparent);border-radius:11px;background:var(--color-accent-900);color:var(--color-accent-300)}
  h2{font-size:17px}header p{margin-top:5px;color:var(--mute);font-size:12.5px;line-height:1.6}header strong{color:var(--ink);font-weight:600}
  .rows{overflow:hidden;border:1px solid var(--line);border-radius:12px;background:var(--sunk)}.rows p{display:flex;justify-content:space-between;gap:12px;padding:9px 13px;font-size:12.5px}.rows p+ p{border-top:1px solid var(--line2)}.rows span{color:var(--mute)}.rows b{font-weight:500;text-align:right}.rows .total{background:color-mix(in srgb,var(--color-accent) 8%,transparent);color:var(--color-accent-200)}.rows .total.confirmed{background:color-mix(in srgb,var(--ok) 8%,transparent);color:var(--ok)}.rows .total b{font-size:15px;font-weight:700}
  .warning{display:flex;align-items:flex-start;gap:9px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#2b2e3f;color:var(--mute);font-size:11.5px;line-height:1.6}.warning>:global(svg){margin-top:1px}.warning.uncertain{border-color:var(--warn-line);background:var(--warn-dim);color:var(--warn)}.warning.blocked{border-color:var(--bad-line);background:var(--bad-dim);color:var(--bad)}
  .dialog footer{display:flex;gap:9px;margin-top:2px}.dialog footer>*{min-height:44px;flex:1}.dialog footer .continue{flex:1.4;gap:7px;border-color:var(--color-accent);background:color-mix(in srgb,var(--color-accent) 13%,transparent);color:var(--color-accent-200);font-size:14px;font-weight:600}.dialog footer .continue.confirmed{border-color:var(--ok-line);background:var(--ok-dim);color:var(--ok)}.dialog footer .continue.blocked{border-color:var(--bad-line);background:var(--bad-dim);color:var(--bad)}
  @media(max-width:520px){.backdrop{align-items:end;padding:0}.dialog{width:100%;max-height:92dvh;padding:16px 14px calc(14px + env(safe-area-inset-bottom));border-radius:20px 20px 0 0}.dialog footer{position:sticky;bottom:0;padding-top:8px;background:var(--raise)}}
</style>
