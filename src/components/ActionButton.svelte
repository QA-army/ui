<script lang="ts">
  let { kind = "primary", label }: { kind?: "primary" | "quiet" | "stop" | "rerun"; label: string } = $props();
</script>

<button type="button" class={kind}>
  {#if kind === "rerun"}
    <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M13 8a5 5 0 1 1-1.4-3.4" fill="none" stroke="currentColor" stroke-width="1.4" /><path d="M12.2 1.8v3.2H9" fill="none" stroke="currentColor" stroke-width="1.4" /></svg>
  {/if}
  {label}
</button>

<style>
  button {
    min-height: 36px;
    padding: 8px 12px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: #0b0b0e;
    color: #f7f5f1;
    font: 600 12px / 1.4 var(--font-body, Inter, sans-serif);
    cursor: pointer;
  }
  button:hover { background: #8a8dff; color: #0b0b0e; }
  .quiet { background: transparent; color: var(--ink); }
  .quiet:hover { background: var(--paper-soft); color: var(--ink); }
  .stop, .rerun {
    border: 1px solid var(--line-soft);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 11px;
    text-transform: uppercase;
  }
  .stop { background: #fffefa; color: #c72c24; }
  .stop:hover { background: #fce3df; color: #c72c24; }
  .rerun { background: transparent; color: var(--ink); }
  .rerun:hover { background: var(--paper-soft); color: var(--ink); }
  svg { width: 14px; height: 14px; display: block; }
  :global(:root[data-theme="dark"]) .stop { background: #1a1214; color: #ff8a82; border-color: #c4372d; }
  :global(:root[data-theme="dark"]) .stop:hover { background: #351b1b; color: #ffb0aa; }
  :global(:root[data-theme="dark"]) button:not(.quiet):not(.stop):not(.rerun) { background: #f4f1eb; color: #0b0b0e; }
</style>
