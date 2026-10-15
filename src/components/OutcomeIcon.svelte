<script lang="ts">
  let { outcome }: { outcome: string } = $props();
  const framed: Readonly<Record<string, "pass" | "fail" | "error" | "idle">> = {
    PASSED: "pass",
    FAILED: "fail",
    ERROR: "error",
    UNEXECUTED: "idle",
    QUEUED: "idle",
  };
  let tone = $derived(framed[outcome]);
</script>

{#if tone === "idle"}
  <svg class="outcome-solid outcome-solid--idle" width="6" height="14" viewBox="0 0 6 14" aria-hidden="true">
    <circle cx="3.5" cy="7" r="2.5" fill="currentColor" />
  </svg>
{:else if tone}
  <svg class="outcome-solid outcome-solid--{tone}" width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
    <rect x="0" y="0" width="18" height="18" fill="currentColor" />
    <path fill="none" stroke={tone === "error" ? "#4a3c1a" : "#fff"} stroke-width="1.6" d={tone === "pass" ? "M5 9l2.5 2.5L13 6" : "M6 6l6 6m0-6l-6 6"} />
  </svg>
{/if}

<style>
  .outcome-solid { display: block; flex: 0 0 14px; }
  .outcome-solid--pass { color: var(--run-passed, #079447); }
  .outcome-solid--fail { color: var(--run-failed, #c4372d); }
  .outcome-solid--error { color: #dcc56a; }
  .outcome-solid--idle { flex: 0 0 6px; width: 6px; color: var(--run-ready-dot, #667085); }
</style>
