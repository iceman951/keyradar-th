<script lang="ts">
  import type { PricePoint } from '$lib/domain/models'
  import { formatBaht } from '$lib/utils/currency'
  let {
    points,
    steamPriceSatang
  }: { points: PricePoint[]; steamPriceSatang: number } = $props()
  let hover = $state<number | null>(null)
  const values = $derived(points.map((point) => point.priceSatang))
  const min = $derived(Math.min(...values) * 0.9)
  const max = $derived(Math.max(steamPriceSatang, ...values) * 1.06)
  const x = (index: number) =>
    points.length > 1 ? (index / (points.length - 1)) * 100 : 0
  const y = (value: number) => 100 - ((value - min) / (max - min)) * 100
  const path = $derived(
    points
      .map(
        (point, index) =>
          `${index ? 'L' : 'M'}${x(index).toFixed(2)} ${y(point.priceSatang).toFixed(2)}`
      )
      .join(' ')
  )
  const area = $derived(`${path} L100 100 L0 100 Z`)
  const lowIndex = $derived(values.indexOf(Math.min(...values)))
  const move = (event: PointerEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    hover = Math.round(
      Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) *
        (points.length - 1)
    )
  }
</script>

<div class="chart surface">
  <div
    class="plot"
    role="application"
    aria-label="เลื่อนตัวชี้เพื่อดูราคาตามวัน"
    onpointermove={move}
    onpointerleave={() => (hover = null)}
  >
    <div class="labels">
      {#each [0, 0.25, 0.5, 0.75, 1] as step}<span style={`top:${step * 100}%`}
          >{formatBaht(max - step * (max - min))}</span
        >{/each}
    </div>
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-label="กราฟประวัติราคา"
    >
      <defs
        ><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"
          ><stop offset="0" stop-color="#9184d9" stop-opacity=".34" /><stop
            offset="1"
            stop-color="#9184d9"
            stop-opacity="0"
          /></linearGradient
        ></defs
      >
      {#each [0, 25, 50, 75, 100] as step}<line
          x1="0"
          y1={step}
          x2="100"
          y2={step}
          class="grid"
        />{/each}
      <path d={area} fill="url(#area)" /><line
        x1="0"
        y1={y(steamPriceSatang)}
        x2="100"
        y2={y(steamPriceSatang)}
        class="steam"
      /><path d={path} class="line" />
      <circle cx={x(lowIndex)} cy={y(values[lowIndex])} r="1.6" class="low" />
      <circle cx="100" cy={y(values.at(-1) ?? 0)} r="1.7" class="current" />
      {#if hover !== null}<line
          x1={x(hover)}
          y1="0"
          x2={x(hover)}
          y2="100"
          class="cursor"
        /><circle
          cx={x(hover)}
          cy={y(values[hover])}
          r="1.8"
          class="hover"
        />{/if}
    </svg>
    <span class="steam-label" style={`top:${y(steamPriceSatang)}%`}
      >Steam {formatBaht(steamPriceSatang)}</span
    >
    <span
      class="low-label"
      style={`left:${x(lowIndex)}%;top:${y(values[lowIndex])}%`}
      >ต่ำสุด {formatBaht(values[lowIndex])}</span
    >
    {#if hover !== null}<div
        class="tooltip"
        class:right={x(hover) > 62}
        style={`left:${x(hover)}%`}
      >
        <small
          >{points[hover].date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: '2-digit'
          })}</small
        ><strong>{formatBaht(values[hover])}</strong><span
          >−{Math.max(
            0,
            Math.round((1 - values[hover] / steamPriceSatang) * 100)
          )}% จาก Steam</span
        >
      </div>{/if}
  </div>
  <div class="ticks">
    {#each [0, 0.25, 0.5, 0.75, 1] as step}{@const point =
        points[Math.round(step * (points.length - 1))]}<span
        >{point?.date.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          year: '2-digit'
        })}</span
      >{/each}
  </div>
  <div class="legend">
    <span><i class="key"></i>ราคาสุทธิต่ำสุดที่ใช้งานในไทยได้</span><span
      ><i class="key steam-key"></i>ราคาบน Steam</span
    ><span><i class="dot"></i>ต่ำสุดในช่วงที่เลือก</span>
  </div>
</div>

<style>
  .chart {
    padding: 18px 16px 14px;
  }
  .plot {
    position: relative;
    height: 216px;
    margin-left: 58px;
    touch-action: pan-y;
    cursor: crosshair;
  }
  .plot svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .grid {
    stroke: rgb(233 233 237 / 7%);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .line {
    fill: none;
    stroke: #9184d9;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .steam {
    stroke: #75798c;
    stroke-width: 1.2;
    stroke-dasharray: 5 5;
    vector-effect: non-scaling-stroke;
  }
  .low {
    fill: var(--ok);
  }
  .current {
    fill: var(--color-accent);
  }
  .cursor {
    stroke: rgb(233 233 237 / 28%);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .hover {
    fill: var(--color-accent-400);
  }
  .labels {
    position: absolute;
    right: calc(100% + 10px);
    top: 0;
    width: 50px;
    height: 100%;
  }
  .labels span {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    color: var(--mute2);
    font-size: 10.5px;
    white-space: nowrap;
  }
  .steam-label,
  .low-label {
    position: absolute;
    padding: 1px 7px;
    border: 1px solid #3a3d52;
    border-radius: 6px;
    background: #2b2e3f;
    color: #cfd3e5;
    font-size: 9.5px;
    font-weight: 600;
    transform: translateY(-50%);
  }
  .steam-label {
    right: 0;
  }
  .low-label {
    border-color: var(--ok-line);
    background: var(--ok-dim);
    color: var(--ok);
    transform: translate(-50%, -190%);
  }
  .tooltip {
    position: absolute;
    top: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    padding: 7px 11px;
    border: 1px solid #3a3d52;
    border-radius: 10px;
    background: rgb(20 22 34 / 96%);
    box-shadow: 0 12px 30px rgb(0 0 0 / 50%);
    transform: translateX(4%);
    white-space: nowrap;
    pointer-events: none;
  }
  .tooltip.right {
    transform: translateX(-104%);
  }
  .tooltip small {
    color: var(--mute2);
  }
  .tooltip strong {
    color: var(--color-accent-200);
    font-size: 17px;
  }
  .tooltip span {
    color: var(--ok);
    font-size: 10.5px;
  }
  .ticks {
    display: flex;
    justify-content: space-between;
    margin: 8px 0 0 64px;
    color: var(--mute2);
    font-size: 10.5px;
  }
  .legend {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 12px;
    padding-top: 11px;
    border-top: 1px solid var(--line2);
    color: var(--mute);
    font-size: 11.5px;
  }
  .legend span {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .key {
    width: 16px;
    height: 2px;
    background: var(--color-accent);
  }
  .steam-key {
    height: 0;
    border-top: 2px dashed #75798c;
    background: none;
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--ok);
    box-shadow: 0 0 0 3px var(--ok-dim);
  }
  @media (max-width: 779px) {
    .chart {
      padding: 14px 12px;
    }
    .plot {
      height: 176px;
      margin-left: 48px;
    }
    .ticks {
      margin-left: 54px;
    }
    .legend {
      gap: 9px;
    }
  }
</style>
