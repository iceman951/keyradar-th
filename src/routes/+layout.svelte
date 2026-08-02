<script lang="ts">
  import 'virtual:uno.css';
  import '$lib/styles/global.css';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';

  let { children } = $props();
</script>

<svelte:head><title>KeyRadar TH — เช็กราคาเกม เล่นได้ในไทย</title><meta name="description" content="เปรียบเทียบราคาสุทธิคีย์เกม Steam พร้อมตรวจสอบการเปิดใช้งานในประเทศไทย" /></svelte:head>
<Header />
{@render children()}
<Footer />
