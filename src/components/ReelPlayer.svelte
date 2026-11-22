<script>
  import { onMount, onDestroy } from 'svelte';

  export let id;
  export let videoUrl = '';
  export let titulo = '';
  export let descripcion = '';
  export let imagenUrl = '';

  let videoEl;
  let playBtnEl;
  let posterEl;
  let reels = [];
  let idx = 0;
  let hls = null;
  const preloadedImages = {};
  let touchStartY = 0;
  let touchEndY = 0;
  let sonidoActivado = false;
  let likes = 0;
  let liked = false;

  function isHls(url) {
    return url && url.includes('.m3u8');
  }

  function preloadImage(url) {
    if (!url || preloadedImages[url]) return;
    const img = new Image();
    img.src = url;
    preloadedImages[url] = img;
  }

  function destroyHls() {
    if (hls) {
      hls.destroy();
      hls = null;
    }
  }

  async function loadHlsJs() {
    if (window.Hls) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function attachSource(url) {
    if (!videoEl || !url) return;
    destroyHls();
    videoEl.removeAttribute('src');
    videoEl.load();

    if (isHls(url)) {
      await loadHlsJs();
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ maxBufferLength: 15, maxMaxBufferLength: 30 });
        hls.loadSource(url);
        hls.attachMedia(videoEl);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          if (sonidoActivado) videoEl.play().catch(() => {});
        });
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = url;
      }
    } else {
      videoEl.src = url;
    }
  }

  async function cargar() {
    try {
      const res = await fetch('/api/reels');
      reels = await res.json();
      idx = reels.findIndex(x => x.id === id);
      if (idx < 0) idx = 0;
      mostrar(idx);
    } catch (e) {}
  }

  async function mostrar(i) {
    if (reels.length === 0) return;
    const len = reels.length;
    idx = ((i % len) + len) % len;
    const r = reels[idx];
    titulo = r.titulo || '';
    descripcion = r.descripcion || '';
    imagenUrl = r.imagen_url || '';
    history.replaceState(null, '', '/reel/' + r.id);

    if (posterEl && imagenUrl) {
      posterEl.src = imagenUrl;
      posterEl.style.opacity = '1';
    }

    const src = r.hls_url || r.video_url || '';
    await attachSource(src);
    if (videoEl) videoEl.poster = imagenUrl;

    if (sonidoActivado && videoEl) {
      videoEl.muted = false;
      videoEl.volume = 1;
      videoEl.play().catch(() => {});
      if (playBtnEl) playBtnEl.style.display = 'none';
    } else if (videoEl) {
      videoEl.muted = true;
      videoEl.pause();
      if (playBtnEl) playBtnEl.style.display = 'flex';
    }

    const next = reels[(idx + 1) % len];
    const prev = reels[(idx - 1 + len) % len];
    if (next?.imagen_url) preloadImage(next.imagen_url);
    if (prev?.imagen_url) preloadImage(prev.imagen_url);
  }

  function next() { mostrar(idx + 1); }
  function prev() { mostrar(idx - 1); }

  function onTouchStart(e) {
    touchStartY = e.changedTouches[0].screenY;
  }
  function onTouchEnd(e) {
    touchEndY = e.changedTouches[0].screenY;
    const diff = touchStartY - touchEndY;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  }

  function play() {
    if (!videoEl) return;
    sonidoActivado = true;
    videoEl.muted = false;
    videoEl.volume = 1;
    videoEl.play();
    if (playBtnEl) playBtnEl.style.display = 'none';
    if (posterEl) posterEl.style.opacity = '0';
  }

  async function cargarLikes() {
    if (!id) return;
    try {
      const res = await fetch('/api/reels-like?reel_id=' + id);
      if (res.ok) {
        const data = await res.json();
        likes = data.likes || 0;
        liked = data.liked || false;
      }
    } catch (e) {}
  }

  async function toggleLike() {
    if (!id) return;
    try {
      const res = await fetch('/api/reels-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reel_id: id })
      });
      if (res.ok) {
        const data = await res.json();
        likes = data.likes || 0;
        liked = data.liked || false;
      }
    } catch (e) {}
  }

  onMount(() => {
    if (imagenUrl) preloadImage(imagenUrl);
    cargar();
    cargarLikes();
  });

  onDestroy(() => destroyHls());
</script>

<div class="reel-box" on:touchstart={onTouchStart} on:touchend={onTouchEnd}>
  {#if imagenUrl}
    <img bind:this={posterEl} class="reel-poster-bg" src={imagenUrl} alt="" />
  {/if}
  <video bind:this={videoEl} playsinline loop preload="auto" muted poster={imagenUrl}></video>
  <button bind:this={playBtnEl} class="play-btn" on:click={play}>▶</button>

  <div class="reel-bottom">
    <div class="reel-info">
      <a href="/" class="reel-logo-link">
        <img src="/logo2.png" alt="A Todo Control" class="reel-logo" />
      </a>
      <div>
        <div class="reel-nombre">A Todo Control</div>
        <div class="reel-tag">Reel</div>
      </div>
    </div>
    <div class="reel-texto">
      <div class="reel-titulo">{titulo}</div>
      <div class="reel-desc">{descripcion}</div>
    </div>
  </div>

  <div class="reel-acciones">
    <button class="reel-like" on:click={toggleLike} style="color:{liked ? '#e11d48' : '#fff'}">♡ <span>{likes}</span></button>
    <button class="reel-comment">💬</button>
    <button class="reel-share">↗</button>
  </div>
</div>

<style>
  .reel-box { position: relative; height: 100%; width: 100%; background: #000; touch-action: pan-y; }
  .reel-poster-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    transition: opacity .3s;
  }
  video { width: 100%; height: 100%; object-fit: cover; position: relative; z-index: 2; }
  .play-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(0,0,0,.5);
    color: #fff;
    font-size: 28px;
    border: none;
    cursor: pointer;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 4px;
  }
  .reel-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: linear-gradient(transparent, rgba(0,0,0,.7));
    color: #fff;
    z-index: 5;
  }
  .reel-info { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .reel-logo { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
  .reel-nombre { font-weight: 600; font-size: 14px; }
  .reel-tag { background: #e11d48; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-top: 2px; letter-spacing: .5px; }
  .reel-titulo { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
  .reel-desc { font-size: 13px; opacity: .9; }
  .reel-acciones {
    position: absolute;
    right: 12px;
    bottom: 80px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    z-index: 6;
  }
  .reel-acciones button {
    background: none;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
  }
</style>
