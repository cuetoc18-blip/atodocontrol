<script>
  let open = false;

  function toggle() {
    open = !open;
    const panel = document.getElementById('menuPanel');
    if (panel) panel.classList.toggle('open', open);
  }
</script>

<button class="hamburger" type="button" aria-label="Menú" on:click={toggle}>
  <span></span><span></span><span></span>
</button>

<style>
  .hamburger {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .hamburger span {
    display: block;
    width: 22px;
    height: 2px;
    background: white;
  }
</style>
