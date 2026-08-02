<script lang="ts">
  let { title, hue, height = 146, large = false }: { title: string; hue: number; height?: number; large?: boolean } = $props();
</script>

<div class="cover" class:large style={`--hue:${hue};--height:${height}px`}><span>{title}</span></div>

<style>
  .cover{position:relative;width:100%;height:var(--height);display:grid;place-items:center;overflow:hidden;border-radius:10px;background:radial-gradient(circle at 25% 10%,hsl(var(--hue) 50% 36% / .7),transparent 48%),linear-gradient(150deg,hsl(var(--hue) 34% 26%),hsl(calc(var(--hue) + 34) 40% 14%) 52%,hsl(calc(var(--hue) + 300) 30% 9%));box-shadow:inset 0 0 0 1px rgb(233 233 237 / 7%),inset 0 -40px 60px rgb(0 0 0 / 35%)}
  .cover>span{padding:0 10%;color:rgb(255 255 255 / 92%);font-size:17px;font-weight:700;line-height:1.15;text-align:center;text-shadow:0 2px 18px rgb(0 0 0 / 50%)}.large>span{font-size:28px}
</style>
