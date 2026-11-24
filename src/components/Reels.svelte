<script>
  import { onMount, onDestroy } from 'svelte';

  let reels = [];
  let loading = true;
  let error = null;
  let container;
  let autoTimer = null;

  onMount(async () => {
    try {
      const res = await fetch('/api/reels');
      const data = await res.json();
      reels = data || [];
    } catch (e) {
      error = 'No se pudieron cargar los reels';
    } finally {
      loading = false;
    }
  });

  function goTo(id) {
    if (id) window.location.href = '/reel/' + id;
  }

  $: if (container && reels.length) {
    const items = container.querySelectorAll('.reel-item');
    items.forEach(item => {
      const v = item.querySelector('video');
      if (v) {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach(e => e.isIntersecting ? v.play().catch(() => {}) : v.pause());
        }, { threshold: 0.5 });
        obs.observe(item);
      }
    });

    if (!autoTimer && items.length > 1) {
      let current = 0;
      autoTimer = setInterval(() => {
        current = (current + 1) % items.length;
        container.scrollTo({ left: items[current].offsetLeft - container.offsetLeft, behavior: 'smooth' });
      }, 4000);
    }
  }

  onDestroy(() => { if (autoTimer) clearInterval(autoTimer); });
</script>

{#if loading}
  <p class="msg">Cargando reels...</p>
{:else if error}
  <p class="msg">{error}</p>
{:else if !reels.length}
  <p class="msg">No hay reels</p>
{:else}
  <div class="reels-container" bind:this={container}>
    {#each reels as reel (reel.id)}
      <div class="reel-item" on:click={() => goTo(reel.id)}>
        <div class="reel-thumb">
          {#if reel.imagen_url}
            <img src={reel.imagen_url} alt="" class="reel-poster" />
          {/if}
          <video src={reel.video_url} muted playsinline loop preload="metadata" poster={reel.imagen_url || ''}></video>
          <div class="reel-play">▶</div>
        </div>
        <p class="reel-title">{reel.titulo || ''}</p>
      </div>
    {/each}
  </div>
{/if}

<style>
  .msg {
    color: #64748b;
    text-align: center;
    padding: 20px 0;
  }
  .reels-container {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding: 8px 0 16px;
    scrollbar-width: none;
  }
  .reels-container::-webkit-scrollbar { display: none; }
  .reel-item {
    flex: 0 0 160px;
    scroll-snap-align: start;
    cursor: pointer;
  }
  .reel-thumb {
    position: relative;
    width: 160px;
    height: 280px;
    border-radius: 12px;
    overflow: hidden;
    background: #111;
  }
  .reel-thumb video,
  .reel-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .reel-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 32px;
    text-shadow: 0 2px 8px rgba(0,0,0,.5);
    pointer-events: none;
  }
  .reel-title {
    margin: 6px 0 0;
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
