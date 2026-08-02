<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Game } from '$lib/domain/models';
  import { gameRepository } from '$lib/data/mock-repository';
  import Autocomplete from './Autocomplete.svelte';
  let { big = false }: { big?: boolean } = $props();
  let query = $state(''), focused = $state(false), loading = $state(false), matches = $state<Game[]>([]);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const search = () => goto(`/search?q=${encodeURIComponent(query.trim() || 'The Forest')}`);
  const update = (value: string) => { query = value; focused = true; loading = true; if(timer) clearTimeout(timer); timer=setTimeout(async()=>{matches=await gameRepository.searchGames(value);loading=false},180); };
  const focus = async () => { focused=true; matches=await gameRepository.searchGames(query); };
</script>
<div class="wrap" class:big>
  <form onsubmit={(event)=>{event.preventDefault();search()}}><span>⌕</span><input bind:value={query} oninput={(event)=>update(event.currentTarget.value)} onfocus={focus} onblur={()=>setTimeout(()=>focused=false,150)} onkeydown={(event)=>{if(event.key==='Escape')focused=false}} placeholder="ค้นหาเกม เช่น Valheim, Elden Ring, Palworld" aria-label="ค้นหาเกม"/><button>ค้นหาเกม</button></form>
  {#if focused}<div class="dropdown"><Autocomplete games={matches} {query} {loading}/></div>{/if}
</div>
<style>.wrap{position:relative;max-width:660px}.wrap form{height:54px;display:flex;align-items:center;gap:12px;padding:0 8px 0 14px;border:1px solid #33364a;border-radius:15px;background:linear-gradient(180deg,#1d2030,#191c2a);box-shadow:0 14px 34px rgb(0 0 0 / 35%)}.wrap form:focus-within{border-color:var(--color-accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--color-accent) 16%,transparent),0 16px 40px rgb(0 0 0 / 45%)}form>span{color:var(--color-accent);font-size:24px}input{min-width:0;flex:1;border:0;background:transparent;color:var(--ink);font-size:14.5px}button{height:40px;padding:0 14px;border:1px solid var(--color-accent);border-radius:11px;background:color-mix(in srgb,var(--color-accent) 16%,transparent);color:var(--color-accent-200);font-weight:600;cursor:pointer}.dropdown{position:absolute;top:calc(100% + 10px);left:0;right:0;z-index:60;overflow:hidden;border:1px solid var(--line);border-radius:14px;box-shadow:0 22px 56px rgb(0 0 0 / 62%)}.big form{height:62px;padding-left:18px}.big input{font-size:16px}.big button{height:46px;padding:0 20px;font-size:14.5px}@media(max-width:520px){button{padding:0 12px}.big form{height:56px;padding-left:12px}.big input{font-size:14px}}</style>
