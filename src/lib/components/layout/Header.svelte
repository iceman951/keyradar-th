<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import type { Game } from '$lib/domain/models';
  import { gameRepository } from '$lib/data/mock-repository';
  import Autocomplete from '$lib/components/search/Autocomplete.svelte';
  import BrandMark from './BrandMark.svelte';

  let query = $state('');
  let focused = $state(false);
  let loading = $state(false);
  let menuOpen = $state(false);
  let matches = $state<Game[]>([]);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const nav = [
    ['/', 'หน้าแรก'], ['/deals', 'เกมลดราคา'], ['/popular', 'เกมยอดนิยม'], ['/stores', 'ร้านค้า'], ['/#how', 'วิธีใช้งาน']
  ] as const;

  const active = (href: string) => href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href.split('#')[0]);
  const update = (value: string) => {
    query = value;
    loading = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => { matches = await gameRepository.searchGames(value); loading = false; }, 180);
  };
  const open = async () => { focused = true; matches = await gameRepository.searchGames(query); };
  const submit = () => goto(`/search?q=${encodeURIComponent(query.trim() || 'The Forest')}`);
  const keydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') focused = false;
    if (event.key === 'Enter') { event.preventDefault(); submit(); }
  };
</script>

<header>
  <div class="desktop inner">
    <a href="/" aria-label="KeyRadar TH หน้าแรก"><BrandMark /></a>
    <nav>{#each nav as item}<a class:active={active(item[0])} href={item[0]}>{item[1]}</a>{/each}</nav>
    <form class="search" onsubmit={(event) => { event.preventDefault(); submit(); }}>
      <span aria-hidden="true">⌕</span>
      <input value={query} oninput={(event) => update(event.currentTarget.value)} onfocus={open} onblur={() => setTimeout(() => focused = false, 150)} onkeydown={keydown} placeholder="ค้นหาเกม…" aria-label="ค้นหาเกม" />
      {#if query}<button type="button" aria-label="ล้างคำค้นหา" onclick={() => update('')}>×</button>{/if}
      {#if focused}<div class="dropdown"><Autocomplete games={matches} {query} {loading} /></div>{/if}
    </form>
  </div>
  <div class="mobile mobile-top">
    <a href="/" aria-label="KeyRadar TH หน้าแรก"><BrandMark compact /></a>
    <button class="menu" aria-label="เมนู" aria-expanded={menuOpen} onclick={() => menuOpen = !menuOpen}>☰</button>
  </div>
  {#if menuOpen}<nav class="mobile mobile-nav">{#each nav as item}<a class:active={active(item[0])} href={item[0]}>{item[1]}</a>{/each}</nav>{/if}
  {#if page.url.pathname !== '/'}
    <form class="mobile mobile-search" onsubmit={(event) => { event.preventDefault(); submit(); }}>
      <div class="search"><span>⌕</span><input value={query} oninput={(event) => update(event.currentTarget.value)} onfocus={open} onblur={() => setTimeout(() => focused = false, 150)} onkeydown={keydown} placeholder="ค้นหาเกม…" aria-label="ค้นหาเกม" /></div>
      {#if focused}<div class="dropdown"><Autocomplete games={matches} {query} {loading} /></div>{/if}
    </form>
  {/if}
</header>

<style>
  header{position:sticky;top:0;z-index:40;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--color-bg) 88%,transparent);backdrop-filter:blur(16px)}
  .inner{max-width:1320px;height:62px;margin:auto;padding:0 28px}.desktop{display:flex;align-items:center;gap:26px}.desktop nav{display:flex;gap:2px}.desktop nav a{padding:7px 11px;border-radius:8px;color:var(--mute);font-size:13.5px}.desktop nav a.active{background:color-mix(in srgb,var(--color-accent) 12%,transparent);color:var(--color-accent-200)}
  .search{position:relative;display:flex;align-items:center;gap:9px;height:38px;border:1px solid var(--line);border-radius:11px;background:var(--sunk);padding:0 12px}.desktop .search{width:min(420px,35vw);margin-left:auto}.search:focus-within{border-color:var(--color-accent)}.search>span{color:var(--mute2);font-size:19px}.search input{min-width:0;flex:1;border:0;background:transparent;color:var(--ink)}.search button{border:0;background:transparent;color:var(--mute);cursor:pointer;font-size:18px}
  .dropdown{position:absolute;top:calc(100% + 8px);left:0;right:0;z-index:60;overflow:hidden;border:1px solid var(--line);border-radius:12px;box-shadow:0 18px 44px rgb(0 0 0 / 60%);animation:rise .14s ease-out}
  .mobile{display:none}.mobile-top{align-items:center;justify-content:space-between;padding:10px 14px}.menu{width:38px;height:38px;border:1px solid var(--line);border-radius:10px;background:transparent;color:var(--ink);font-size:18px}.mobile-nav{padding:6px 8px 10px;border-top:1px solid var(--line)}.mobile-nav a{display:block;padding:12px;border-radius:10px;color:var(--ink);font-size:15px}.mobile-nav a.active{background:color-mix(in srgb,var(--color-accent) 12%,transparent);color:var(--color-accent-200)}.mobile-search{position:relative;padding:0 14px 11px}.mobile-search .search{height:42px}
  @media(max-width:779px){.desktop{display:none}.mobile{display:flex}.mobile-nav{display:block}.mobile-search{display:block}}
</style>
