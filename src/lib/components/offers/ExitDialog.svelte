<script lang="ts">
  import type { Game, Offer, Store } from '$lib/domain/models';
  import { formatBaht } from '$lib/utils/currency';
  let { offer, game, store, onclose }: { offer: Offer; game: Game; store: Store; onclose: () => void } = $props();
</script>

<div class="backdrop" role="presentation" onclick={(event) => { if (event.currentTarget === event.target) onclose(); }}>
  <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
    <header><span>↗</span><div><h2 id="dialog-title">คุณกำลังออกจาก KeyRadar TH</h2><p>เรากำลังพาคุณไปที่ <strong>{store.name}</strong> การชำระเงินและการรับคีย์เกิดขึ้นบนเว็บไซต์ของร้านค้า</p></div></header>
    <div class="rows"><p><span>เกม</span><b>{game.title}</b></p><p><span>ราคาที่โฆษณา</span><b>{formatBaht(offer.advertisedSatang)}</b></p><p><span>ค่าธรรมเนียมที่ทราบ</span><b>{offer.feeSatang ? formatBaht(offer.feeSatang) : 'ไม่มี'}</b></p><p class="total"><span>ราคาสุทธิโดยประมาณ</span><b>{formatBaht(offer.finalSatang)}</b></p><p><span>ภูมิภาค / DRM</span><b>{offer.region} · {offer.drm}</b></p></div>
    <div class="warning">⚠ กรุณายืนยันภูมิภาคของคีย์บนหน้าร้านค้าอีกครั้งก่อนชำระเงิน</div>
    <footer><button class="btn" onclick={onclose}>ยกเลิก</button><button class="btn continue" onclick={onclose}>ไปยัง {store.name} ↗</button></footer>
  </div>
</div>

<style>
  .backdrop{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:18px;background:rgb(9 11 18 / 72%);backdrop-filter:blur(4px)}.dialog{width:min(430px,100%);display:flex;flex-direction:column;gap:14px;padding:18px;border:1px solid var(--line);border-radius:18px;background:var(--raise);box-shadow:0 28px 70px rgb(0 0 0 / 66%);animation:rise .18s}.dialog header{display:flex;align-items:flex-start;gap:12px}.dialog header>span{width:38px;height:38px;display:grid;place-items:center;flex:none;border:1px solid color-mix(in srgb,var(--color-accent) 30%,transparent);border-radius:11px;background:var(--color-accent-900);color:var(--color-accent-300)}h2{font-size:17px}header p{margin-top:5px;color:var(--mute);font-size:12.5px;line-height:1.6}.rows{overflow:hidden;border:1px solid var(--line);border-radius:12px;background:var(--sunk)}.rows p{display:flex;justify-content:space-between;gap:12px;padding:8px 12px;font-size:12px}.rows p+ p{border-top:1px solid var(--line2)}.rows span{color:var(--mute)}.rows b{text-align:right}.rows .total{background:color-mix(in srgb,var(--ok) 8%,transparent);color:var(--ok)}.warning{padding:10px 12px;border:1px solid var(--warn-line);border-radius:10px;background:var(--warn-dim);color:var(--warn);font-size:11.5px;line-height:1.6}.dialog footer{display:flex;gap:9px}.dialog footer button{flex:1;height:44px}.dialog footer .continue{flex:1.4;border-color:var(--ok-line);background:var(--ok-dim);color:var(--ok);font-weight:600}
</style>
