<script>
  import { onMount } from 'svelte';

  export let id;
  export let videoUrl = '';
  export let titulo = '';
  export let descripcion = '';

  let videoEl;
  let playBtnEl;
  let reels = [];
  let idx = 0;
  const preloaded = {};
  let touchStartY = 0;
  let touchEndY = 0;

  function preload(i) {
    const len = reels.length;
    if (len === 0) return;
    const real = ((i % len) + len) % len;
    if (preloaded[real]) return;
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    v.src = reels[real].video_url;
    v.load();
    preloaded[real] = v;
  }

  async function cargar() {
    if (videoUrl && videoEl) {
      videoEl.src = videoUrl;
      videoEl.load();
    }
    try {
      const res = await fetch('/api/reels');
      reels = await res.json();
      idx = reels.findIndex(x => x.id === id);
      if (idx < 0) idx = 0;
      mostrar(idx);
    } catch (e) {}
  }

  function mostrar(i) {
    if (reels.length === 0) return;
    const len = reels.length;
    idx = ((i % len) + len) % len;
    const r = reels[idx];
    titulo = r.titulo || '';
    descripcion = r.descripcion || '';
    history.replaceState(null, '', '/reel/' + r.id);

    if (videoEl) {
      const cached = preloaded[idx];
      if (cached && cached.readyState >= 2) {
        videoEl.src = cached.src;
        videoEl.currentTime = 0;
      } else {
        videoEl.src = r.video_url;
      }
      videoEl.muted = true;
      videoEl.play().then(() => {
        if (playBtnEl) playBtnEl.style.display = 'none';
      }).catch(() => {
        if (playBtnEl) playBtnEl.style.display = 'flex';
      });
    }
    preload(idx + 1);
    preload(idx - 1);
  }

  function next() { mostrar(idx + 1); }
  function prev() { mostrar(idx - 1); }

  function onTouchStart(e) {
    touchStartY = e.changedTouches[0].screenY;
    if (videoEl && videoEl.muted) {
      videoEl.muted = false;
      videoEl.volume = 1;
    }
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
    videoEl.muted = false;
    videoEl.volume = 1;
    videoEl.play();
    if (playBtnEl) playBtnEl.style.display = 'none';
    preloaded[idx] = videoEl;
    preload(idx + 1);
    preload(idx - 1);
  }

  let likes = 0;
  let liked = false;

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
    cargar();
    cargarLikes();
  });
</script>

<div class="reel-box" on:touchstart={onTouchStart} on:touchend={onTouchEnd}>
  <video bind:this={videoEl} playsinline loop preload="auto" muted autoplay></video>
  <button bind:this={playBtnEl} class="play-btn" on:click={play} style="display:none">▶</button>

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
  video { width: 100%; height: 100%; object-fit: cover; }
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
    font-size: 32px;
    border: none;
    cursor: pointer;
    z-index: 10;
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
