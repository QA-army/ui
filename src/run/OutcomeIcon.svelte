<script lang="ts">
  // Passed and failed are solid squares. A step that has not run is a small grey dot.
  let { outcome }: { outcome: string } = $props();
  const framed: Readonly<Record<string, 'pass' | 'fail' | 'idle'>> = { PASSED: 'pass', FAILED: 'fail', ERROR: 'fail', UNEXECUTED: 'idle', QUEUED: 'idle' };
  const paths: Readonly<Record<string, string>> = {
    STARTED: 'M5 3l8 5-8 5V3z',
  };
  let tone = $derived(framed[outcome]);
  let path = $derived(paths[outcome]);
</script>
{#if tone === 'idle'}
  <svg class="outcome-solid outcome-solid--idle" width="6" height="14" viewBox="0 0 6 14" aria-hidden="true">
    <circle cx="3.5" cy="7" r="2.5" fill="currentColor" />
  </svg>
{:else if tone}
  <svg class="outcome-solid outcome-solid--{tone}" width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <rect x="0" y="0" width="18" height="18" stroke="none" fill="currentColor" />
    <path stroke="#fff" d={tone === 'pass' ? 'M5 9l2.5 2.5L13 6' : 'M6 6l6 6m0-6l-6 6'} />
  </svg>
{:else if path}
  <svg aria-hidden="true" viewBox="0 0 18 18" fill="currentColor"><path d={path} /></svg>
{/if}
<style>
  .outcome-solid { display: block; flex: 0 0 14px; }
  .outcome-solid--pass { color: var(--run-passed, #079447); }
  .outcome-solid--fail { color: var(--run-failed, #c4372d); }
  .outcome-solid--idle { flex-basis: 6px; width: 6px; color: var(--run-ready-dot, #667085); }
  svg:not(.outcome-solid) { width: 12px; height: 12px; margin-right: 4px; vertical-align: -2px; }
</style>
