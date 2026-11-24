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

  function esHls(url) {
    return !!url && url.includes('.m3u8');
  }

  function cargarHlsJs() {
    if (window.Hls) return Promise.resolve();
    if (!window.__hlsJsPromise) {
      window.__hlsJsPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return window.__hlsJsPromise;
  }

  // Solo actúa con videos .m3u8; los MP4 usan src normal
  function fuenteHls(video, url) {
    let hls = null;
    if (esHls(url)) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else {
        cargarHlsJs().then(() => {
          if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({ maxBufferLength: 10, maxMaxBufferLength: 20 });
            hls.loadSource(url);
            hls.attachMedia(video);
          }
        }).catch(() => {});
      }
    }
    return {
      destroy() { if (hls) { hls.destroy(); hls = null; } }
    };
  }

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
          <video src={esHls(reel.video_url) ? null : reel.video_url} use:fuenteHls={reel.video_url} muted playsinline loop preload="metadata" poster={reel.imagen_url || ''} on:playing={(e) => e.currentTarget.classList.add('listo')}></video>
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
    gap: 10px;
    overflow-x: auto;
    padding: 8px 0 16px;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x mandatory;
  }
  .reel-item {
    flex: 0 0 140px;
    width: 140px;
    min-width: 140px;
    max-width: 140px;
    scroll-snap-align: start;
    cursor: pointer;
  }
  .reel-thumb {
    width: 140px;
    height: 249px;
    background: #111;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
  }
  .reel-thumb .reel-poster {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }
  .reel-thumb video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    opacity: 0;
    transition: opacity .3s;
  }
  .reel-thumb :global(video.listo) {
    opacity: 1;
  }
  .reel-play {
    position: absolute;
    width: 40px;
    height: 40px;
    background: rgba(0,0,0,.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 16px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 3;
    pointer-events: none;
  }
  .reel-title {
    margin: 10px 0 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #111;
    line-height: 1.35;
  }
</style>
