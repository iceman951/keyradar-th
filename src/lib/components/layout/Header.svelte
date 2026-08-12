<script lang="ts">
  import { page } from '$app/state'
  import Icon from '$lib/components/ui/Icon.svelte'
  import SearchBox from '$lib/components/search/SearchBox.svelte'
  import BrandMark from './BrandMark.svelte'

  let menuOpen = $state(false)

  const nav = [
    ['/', 'หน้าแรก'],
    ['/deals', 'เกมลดราคา'],
    ['/popular', 'เกมยอดนิยม'],
    ['/stores', 'ร้านค้า'],
    ['/#how', 'วิธีใช้งาน']
  ] as const

  const active = (href: string) => {
    if (href === '/') return page.url.pathname === '/' && !page.url.hash
    if (href.includes('#')) {
      const [pathname, hash] = href.split('#')
      return page.url.pathname === pathname && page.url.hash === `#${hash}`
    }
    return page.url.pathname.startsWith(href)
  }
</script>

<header>
  <div class="desktop inner">
    <a class="home" href="/" aria-label="KeyRadar TH หน้าแรก"><BrandMark /></a>
    <nav aria-label="เมนูหลัก">
      {#each nav as item}<a class:active={active(item[0])} href={item[0]}
          >{item[1]}</a
        >{/each}
    </nav>
    <SearchBox compact />
  </div>

  <div class="mobile mobile-top">
    <a class="home" href="/" aria-label="KeyRadar TH หน้าแรก"
      ><BrandMark compact /></a
    >
    <button
      class="menu"
      type="button"
      aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
      aria-expanded={menuOpen}
      aria-controls="mobile-navigation"
      onclick={() => {
        menuOpen = !menuOpen
      }}><Icon name={menuOpen ? 'x' : 'menu'} size={17} /></button
    >
  </div>

  {#if page.url.pathname !== '/'}
    <div class="mobile mobile-search"><SearchBox compact /></div>
  {/if}

  {#if menuOpen}
    <nav
      id="mobile-navigation"
      class="mobile mobile-nav"
      aria-label="เมนูหลักบนมือถือ"
    >
      {#each nav as item}<a
          class:active={active(item[0])}
          href={item[0]}
          onclick={() => {
            menuOpen = false
          }}>{item[1]}</a
        >{/each}
    </nav>
  {/if}
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 40;
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--color-bg) 88%, transparent);
    backdrop-filter: blur(16px);
  }
  .inner {
    max-width: 1320px;
    height: 62px;
    margin: auto;
    padding: 0 28px;
  }
  .desktop {
    display: flex;
    align-items: center;
    gap: 26px;
  }
  .home {
    flex: none;
    color: var(--ink);
  }
  .desktop nav {
    display: flex;
    gap: 2px;
    flex: none;
  }
  .desktop nav a {
    padding: 7px 11px;
    border-radius: 8px;
    color: var(--mute);
    font-size: 13.5px;
  }
  .desktop nav a:hover {
    background: color-mix(in srgb, var(--ink) 4%, transparent);
    color: var(--ink);
  }
  nav a.active {
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
    color: var(--color-accent-200);
  }
  .mobile {
    display: none;
  }
  .mobile-top {
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
  }
  .menu {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex: none;
    border: 1px solid var(--line);
    border-radius: 11px;
    background: transparent;
    color: var(--ink);
    cursor: pointer;
  }
  .mobile-search {
    position: relative;
    padding: 0 14px 11px;
  }
  .mobile-nav {
    padding: 6px 8px 10px;
    border-top: 1px solid var(--line);
    animation: rise 0.16s ease-out;
  }
  .mobile-nav a {
    display: block;
    min-height: 44px;
    padding: 11px 12px;
    border-radius: 10px;
    color: var(--ink);
    font-size: 15px;
  }
  @media (max-width: 900px) {
    .desktop {
      gap: 14px;
    }
    .desktop nav a {
      padding-inline: 8px;
    }
  }
  @media (max-width: 779px) {
    header {
      background: color-mix(in srgb, var(--color-bg) 92%, transparent);
    }
    .desktop {
      display: none;
    }
    .mobile {
      display: flex;
    }
    .mobile-nav {
      display: block;
    }
    .mobile-search {
      display: block;
    }
  }
</style>
