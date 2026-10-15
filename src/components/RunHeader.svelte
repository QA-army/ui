<script lang="ts">
  import ActionButton from "./ActionButton.svelte";
  import StatusBadge from "./StatusBadge.svelte";

  let { state }: { state: "passed" | "live" } = $props();
</script>

<header class="run-header">
  <div>
    <p>Sample run</p>
    <h3>Checkout</h3>
  </div>
  <div class="actions">
    {#if state === "passed"}
      <StatusBadge status="passed" />
      <span class="time">0:42</span>
      <ActionButton kind="rerun" label="Rerun" />
    {:else}
      <span class="running" aria-label="Running"></span>
      <span class="time live">0:18</span>
      <ActionButton kind="stop" label="Stop" />
    {/if}
  </div>
</header>

<style>
  .run-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 16px;
    background: var(--surface-raised);
    border-bottom: 1px solid var(--line-soft);
  }
  p {
    margin: 0 0 2px;
    color: var(--muted);
    font: 500 11px / 1.4 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  h3 {
    margin: 0;
    color: var(--ink);
    font-family: var(--font-display, "Space Grotesk", sans-serif);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .actions { display: flex; align-items: center; gap: 8px; }
  .time {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    padding: 2px 8px;
    border: 1px solid var(--line-soft);
    color: var(--ink);
    font: 600 10px / 1.4 var(--font-mono, ui-monospace, monospace);
  }
  .live {
    min-height: 36px;
    padding: 8px 12px;
    color: var(--run-passed);
    border-color: var(--run-passed);
    animation: fade 2s ease-in-out infinite;
  }
  .running {
    width: 13px;
    height: 13px;
    background: var(--run-running-dot);
    animation: spin 2s linear infinite;
  }
  @keyframes fade { 50% { opacity: 0.5; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .live, .running { animation: none; }
  }
</style>
