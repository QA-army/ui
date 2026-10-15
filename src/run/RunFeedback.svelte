<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { RunClient } from './model';

  let { runs, runId, terminal }: { runs: RunClient; runId: string; terminal: boolean } = $props();
  let useful = $state<boolean | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let loadFailed = $state(false);
  let message = $state('');
  let failed = $state(false);
  let retry = $state(0);
  let active = true;
  onDestroy(() => { active = false; });

  $effect(() => {
    const id = runId, client = runs, finished = terminal;
    void retry;
    let current = true;
    useful = null; message = ''; failed = false; loadFailed = false;
    loading = finished;
    if (finished) void client.getFeedback(id).then(value => {
      if (current) useful = value?.useful ?? null;
    }).catch(() => {
      if (current) { loadFailed = true; failed = true; message = 'Could not load your feedback.'; }
    }).finally(() => { if (current) loading = false; });
    return () => { current = false; };
  });

  async function vote(value: boolean) {
    if (!terminal || loading || saving || loadFailed || useful === value) return;
    saving = true; failed = false; message = '';
    try {
      const feedback = await runs.setFeedback(runId, value);
      if (active) { useful = feedback.useful; message = 'Feedback saved.'; }
    } catch {
      // A lost response can follow a committed write. Read the confirmed value
      // without automatically submitting another vote.
      try {
        const feedback = await runs.getFeedback(runId);
        if (active) {
          useful = feedback?.useful ?? null;
          failed = useful !== value;
          message = failed ? 'Could not save your feedback. Try again.' : 'Feedback saved.';
        }
      } catch {
        if (active) { failed = true; message = 'Could not confirm your feedback. Try again.'; }
      }
    } finally { if (active) saving = false; }
  }
</script>

<div class="run-feedback">
  <div class="run-feedback__buttons" role="group" aria-label="Was this Run report useful?" aria-busy={loading || saving}>
    {#each [true, false] as positive}
      <button type="button" aria-label={positive ? 'Thumbs up: useful report' : 'Thumbs down: not useful report'} aria-pressed={useful === positive} disabled={!terminal || loading || saving || loadFailed} title={!terminal ? 'Feedback is available when the Run finishes' : positive ? 'Useful report' : 'Not useful report'} onclick={() => vote(positive)}>
        <svg class:thumb-down={!positive} aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter"><path d="M7 10H3v11h4V10Zm0 0 5-7h2v6h5a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H7" /></svg>
      </button>
    {/each}
    {#if loadFailed}<button type="button" onclick={() => retry += 1}>Retry feedback</button>{/if}
  </div>
  {#if message}<p role={failed ? 'alert' : 'status'}>{message}</p>{/if}
</div>

<style>
  .run-feedback { min-width: 0; }
  .run-feedback__buttons { display: flex; gap: 4px; }
  button { display: grid; place-items: center; min-width: 32px; min-height: 32px; padding: 4px; border: 1px solid transparent; border-radius: 0; background: transparent; color: var(--muted); cursor: pointer; }
  button:hover:not(:disabled), button[aria-pressed='true'] { border-color: var(--line-soft); background: var(--surface-raised); color: var(--text); }
  button:disabled { cursor: default; opacity: .45; }
  .thumb-down { transform: rotate(180deg); }
  p { margin: 6px 0 0; color: var(--muted); font-size: 11px; }
  @media (max-width: 900px) { button { min-width: 44px; min-height: 44px; } }
</style>
