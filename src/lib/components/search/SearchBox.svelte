<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Game } from '$lib/domain/models';
  import { gameRepository } from '$lib/data/repository';
  import Icon from '$lib/components/ui/Icon.svelte';
  import Autocomplete from './Autocomplete.svelte';

  let {
    big = false,
    compact = false,
    placeholder
  }: { big?: boolean; compact?: boolean; placeholder?: string } = $props();

  let query = $state('');
  let focused = $state(false);
  let loading = $state(false);
  let mobile = $state(false);
  let matches = $state<Game[]>([]);
  let activeIndex = $state(-1);
  let inputElement: HTMLInputElement;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let blurTimer: ReturnType<typeof setTimeout> | undefined;
  let requestId = 0;

  const listboxId = $derived(big ? 'hero-game-search-results' : compact ? 'header-game-search-results' : 'game-search-results');
  const inputPlaceholder = $derived(placeholder ?? (big
    ? mobile ? 'ค้นหาเกม เช่น Elden Ring' : 'ค้นหาเกม เช่น Valheim, Elden Ring, Palworld'
    : 'ค้นหาเกม…'));

  $effect(() => {
    const media = window.matchMedia('(max-width: 520px)');
    const sync = () => { mobile = media.matches; };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  });

  $effect(() => () => {
    if (timer) clearTimeout(timer);
    if (blurTimer) clearTimeout(blurTimer);
  });

  const loadMatches = async (value: string) => {
    const currentRequest = ++requestId;
    loading = true;
    try {
      const results = await gameRepository.searchGames(value);
      if (currentRequest === requestId) {
        matches = results;
        if (activeIndex >= results.length) activeIndex = -1;
      }
    } finally {
      if (currentRequest === requestId) loading = false;
    }
  };

  const update = (value: string) => {
    query = value;
    focused = true;
    activeIndex = -1;
    requestId += 1;
    matches = [];
    loading = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void loadMatches(value), 180);
  };

  const focus = () => {
    if (blurTimer) clearTimeout(blurTimer);
    focused = true;
    void loadMatches(query);
  };

  const blur = () => {
    if (blurTimer) clearTimeout(blurTimer);
    blurTimer = setTimeout(() => { focused = false; }, 160);
  };

  const clear = () => {
    if (timer) clearTimeout(timer);
    query = '';
    activeIndex = -1;
    focused = true;
    void loadMatches('');
    inputElement.focus();
  };

  const submit = () => {
    focused = false;
    void goto(`/search?q=${encodeURIComponent(query.trim() || 'The Forest')}`);
  };

  const keydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' && matches.length) {
      event.preventDefault();
      focused = true;
      activeIndex = activeIndex < matches.length - 1 ? activeIndex + 1 : 0;
      return;
    }
    if (event.key === 'ArrowUp' && matches.length) {
      event.preventDefault();
      focused = true;
      activeIndex = activeIndex > 0 ? activeIndex - 1 : matches.length - 1;
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const selected = matches[activeIndex];
      if (focused && selected) {
        focused = false;
        void goto(`/games/${selected.slug}`);
      } else submit();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      focused = false;
      inputElement.blur();
    }
  };
</script>

<div class="wrap" class:big class:compact>
  <form role="search" onsubmit={(event) => { event.preventDefault(); submit(); }}>
    <Icon name="search" size={big ? 21 : 16} />
    <input
      bind:this={inputElement}
      value={query}
      oninput={(event) => update(event.currentTarget.value)}
      onfocus={focus}
      onblur={blur}
      onkeydown={keydown}
      placeholder={inputPlaceholder}
      aria-label="ค้นหาเกม"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      aria-expanded={focused}
      aria-controls={focused ? listboxId : undefined}
      aria-activedescendant={focused && activeIndex >= 0 && matches[activeIndex] ? `${listboxId}-option-${matches[activeIndex].slug}` : undefined}
      autocomplete="off"
    />
    {#if query}
      <button class="clear" type="button" aria-label="ล้างคำค้นหา" onclick={clear}>
        <Icon name="x" size={14} />
      </button>
    {/if}
    {#if !compact}<button class="submit" type="submit">{mobile && big ? 'ค้นหา' : 'ค้นหาเกม'}</button>{/if}
  </form>
  {#if focused}
    <div class="dropdown"><Autocomplete id={listboxId} games={matches} {query} {loading} {activeIndex} onactive={(index) => { activeIndex = index; }} /></div>
  {/if}
</div>

<style>
  .wrap{position:relative;max-width:660px;isolation:isolate;z-index:1}
  form{height:54px;display:flex;align-items:center;gap:12px;padding:0 8px 0 14px;border:1px solid #33364a;border-radius:15px;background:linear-gradient(180deg,#1d2030,#191c2a);box-shadow:0 14px 34px rgb(0 0 0 / 35%)}
  form:focus-within{border-color:var(--color-accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--color-accent) 16%,transparent),0 16px 40px rgb(0 0 0 / 45%)}
  form>:global(svg){color:var(--color-accent)}
  input{min-width:0;flex:1;height:100%;border:0;outline:0;background:transparent;color:var(--ink);font-size:14.5px}
  button{display:inline-flex;align-items:center;justify-content:center;border:0;cursor:pointer}
  .submit{min-height:40px;padding:0 14px;border:1px solid var(--color-accent);border-radius:11px;background:color-mix(in srgb,var(--color-accent) 16%,transparent);color:var(--color-accent-200);font-weight:600}
  .clear{width:34px;height:34px;flex:none;border-radius:9px;background:transparent;color:var(--mute2)}
  .clear:hover{background:color-mix(in srgb,var(--ink) 7%,transparent);color:var(--ink)}
  .dropdown{position:absolute;top:calc(100% + 10px);left:0;right:0;z-index:60;overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--raise);box-shadow:0 22px 56px rgb(0 0 0 / 62%);animation:rise .14s ease-out}
  .big{z-index:70}
  .big form{height:62px;padding-left:18px}
  .big input{font-size:16px}
  .big .submit{min-height:46px;padding:0 20px;font-size:14.5px}
  .compact{width:min(420px,35vw);margin-left:auto;z-index:auto}
  .compact form{height:38px;gap:9px;padding:0 8px 0 12px;border-color:var(--line);border-radius:11px;background:var(--sunk);box-shadow:none}
  .compact form:focus-within{box-shadow:none}
  .compact form>:global(svg){color:var(--mute2)}
  .compact input{font-size:13.5px}
  .compact .dropdown{top:calc(100% + 8px);border-radius:12px;box-shadow:0 18px 44px rgb(0 0 0 / 60%)}
  @media(max-width:779px){
    .compact{width:100%;max-width:none;margin:0}
    .compact form{height:44px}
    .compact input{font-size:15px}
    .compact .dropdown{top:calc(100% + 6px)}
  }
  @media(max-width:520px){
    .submit{min-height:44px;padding:0 12px}
    .clear{width:36px;height:36px}
    .big form{height:56px;padding-left:12px;gap:9px}
    .big input{font-size:14px}
    .big .submit{min-height:44px;padding:0 13px;font-size:13.5px}
  }
</style>
