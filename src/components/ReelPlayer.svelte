<script>
  export let id;
  export let videoUrl = '';

  let videoEl;
  let playBtnEl;
  let reels = [];
  let idx = 0;
  const preloaded = {};

  function preload(i) {
    if (i < 0 || i >= reels.length || preloaded[i]) return;
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    v.src = reels[i].video_url;
    v.load();
    preloaded[i] = v;
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
      const r = reels[idx];
      if (videoEl && (!videoEl.src || videoEl.src !== r.video_url)) {
        videoEl.src = r.video_url;
        videoEl.load();
      }
    } catch (e) {}
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

  import { onMount } from 'svelte';
  onMount(cargar);
</script>

<div class="reel-box">
  <video bind:this={videoEl} playsinline loop preload="auto"></video>
  <button bind:this={playBtnEl} class="play-btn" on:click={play}>▶</button>
</div>

<style>
  .reel-box { position: relative; height: 100%; width: 100%; }
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
</style>
