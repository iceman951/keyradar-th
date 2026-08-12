<script lang="ts">
  import type { StoreType } from '$lib/domain/models'
  let {
    initials,
    type,
    size = 34
  }: { initials: string; type: StoreType; size?: number } = $props()
</script>

<span class="logo {type}" style={`--size:${size}px`}>{initials}</span>

<style>
  .logo {
    width: var(--size);
    height: var(--size);
    display: grid;
    place-items: center;
    flex: none;
    border: 1px solid;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
  }
  .steam {
    border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
    background: var(--color-accent-900);
    color: var(--color-accent-300);
  }
  .official {
    border-color: var(--ok-line);
    background: var(--ok-dim);
    color: var(--ok);
  }
  .reseller {
    border-color: var(--warn-line);
    background: var(--warn-dim);
    color: var(--warn);
  }
  .marketplace {
    border-color: #454a66;
    background: #31344a;
    color: #cfd3e5;
  }
</style>
