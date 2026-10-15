<script lang="ts">
  let playing = $state(false);
  let position = $state(36);
  let speed = $state("1");
</script>

<div class="transport" role="group" aria-label="Playback">
  <button type="button" aria-label={playing ? "Pause" : "Play"} onclick={() => (playing = !playing)}>
    {playing ? "Pause" : "Play"}
  </button>
  <button type="button" aria-label="Previous step">Prev</button>
  <button type="button" aria-label="Next step">Next</button>
  <span class="time">0:12</span>
  <input type="range" min="0" max="100" bind:value={position} aria-label="Seek" />
  <select bind:value={speed} aria-label="Playback speed">
    <option value="0.5">0.5×</option>
    <option value="1">1×</option>
    <option value="2">2×</option>
  </select>
  <button type="button" aria-label="Fullscreen">Full</button>
</div>

<style>
  .transport {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 4px;
    background: var(--surface-raised);
  }
  button, select {
    height: 36px;
    padding: 0 8px;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    color: var(--ink);
    font: 600 11px / 1 var(--font-mono, ui-monospace, monospace);
    text-transform: uppercase;
    cursor: pointer;
  }
  button:hover, select:hover { background: var(--paper-soft); }
  .time { padding: 0 8px; color: var(--muted); font: 11px var(--font-mono, ui-monospace, monospace); }
  input[type="range"] {
    flex: 1 1 auto;
    min-width: 48px;
    height: 36px;
    margin: 0;
    accent-color: var(--ink);
    border-radius: 0;
  }
  select { width: 64px; }
</style>
