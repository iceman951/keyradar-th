<script lang="ts">
  let { compact = false }: { compact?: boolean } = $props();
</script>

<span class="brand" class:compact>
  <svg width={compact ? 22 : 26} height={compact ? 22 : 26} viewBox="0 0 26 26" fill="none" aria-hidden="true">
    <circle cx="13" cy="13" r="11.2" stroke="#3a3d55" stroke-width="1.2" />
    <circle cx="13" cy="13" r="6.6" stroke="#3a3d55" stroke-width="1.2" />
    <path d="M13 13 L13 1.8 A11.2 11.2 0 0 1 22.9 8.1 Z" fill="#9184d9" opacity=".28" />
    <path d="M13 13 L22.9 8.1" stroke="#9184d9" stroke-width="1.4" stroke-linecap="round" />
    <circle cx="18.4" cy="16.9" r="2" fill="#9184d9" />
  </svg>
  <span class="word">KEYRADAR <small>TH</small></span>
</span>

<style>
  .brand { display: inline-flex; align-items: center; gap: 9px; color: var(--ink); }
  .word { font-size: 15.5px; font-weight: 700; letter-spacing: .07em; }
  small { color: var(--color-accent); font-size: 9px; letter-spacing: .2em; }
  .compact .word { font-size: 14px; }
</style>
