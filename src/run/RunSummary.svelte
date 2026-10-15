<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Run } from './model';
  import { formatDuration } from './run-detail-model';

  let { status, passedSteps, failedSteps, errorSteps, elapsedMs, children, footer }: {
    status: Run['status']; passedSteps: number; failedSteps: number; errorSteps: number; elapsedMs: number; children?: Snippet; footer?: Snippet;
  } = $props();
  const headings: Record<Run['status'], string> = {
    READY: 'Test ready', QUEUED: 'Test queued', PROVISIONING: 'Preparing test',
    RUNNING: 'Test in progress', PASSED: 'No issues found', FLAKY: 'Some steps passed',
    FAILED: 'Product issue found', ERROR: 'Run needs attention', CANCELLED: 'Test cancelled',
    MOCKED: 'Mocked evidence',
  };
  const tones: Record<Run['status'], string> = {
    READY: 'ready', QUEUED: 'queued', PROVISIONING: 'provisioning', RUNNING: 'active',
    PASSED: 'passed', FLAKY: 'flaky', FAILED: 'attention', ERROR: 'error',
    CANCELLED: 'neutral', MOCKED: 'mocked',
  };
  let tone = $derived(tones[status]);
</script>

<section class="run-summary run-summary--{tone}" aria-label="Run result summary">
  <div class="run-summary__heading">
    <span class="run-summary__mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter">
        {#if status === 'PASSED'}<path d="m5 12 4 4L19 6" />
        {:else if status === 'FAILED'}<path d="m6 6 12 12M6 18 18 6" />
        {:else if status === 'ERROR'}<path d="M12 5v9m0 4v1" />
        {:else if status === 'FLAKY'}<path d="M7 7h10v10H7zM12 7v10" />
        {:else if status === 'MOCKED'}<path d="M6 6h12v12H6z" />
        {:else if status === 'CANCELLED'}<path d="M7 7h10v10H7z" />
        {:else}<path d="m9 5 9 7-9 7zM5 5v14" />{/if}
      </svg>
    </span>
    <div class="run-summary__identity">
      <span class="run-summary__eyebrow">Run summary</span>
      <h2 aria-live="polite" aria-atomic="true">{headings[status]}</h2>
    </div>
  </div>
  <dl class="run-summary__stats">
    <div class="run-summary__stat run-summary__stat--passed"><dt>Passed</dt><dd>{passedSteps}</dd></div>
    <div class="run-summary__stat {failedSteps > 0 ? 'has-issues' : ''}"><dt>Failed</dt><dd>{failedSteps}</dd></div>
    <div class="run-summary__stat {errorSteps > 0 ? 'has-issues' : ''}"><dt>Errors</dt><dd>{errorSteps}</dd></div>
    <div class="run-summary__stat"><dt>Duration</dt><dd>{formatDuration(elapsedMs)}</dd></div>
  </dl>
  {#if children}<div class="run-summary__evidence">{@render children()}</div>{/if}
  {#if footer}<footer class="run-summary__footer">{@render footer()}</footer>{/if}
</section>

<style>
  .run-summary {
    --summary-accent: var(--accent-strong);
    container: run-summary / inline-size;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 16px;
    border-block: 1px solid var(--line-soft);
    border-inline-start: 0;
    border-radius: 0;
    background: var(--surface-raised);
    color: var(--text);
  }
  .run-summary > * { flex-shrink: 0; }
  .run-summary__footer { position: sticky; bottom: 0; z-index: 2; margin-top: auto; margin-inline: -16px; margin-bottom: -16px; padding: 8px 16px 8px 8px; background: var(--surface-raised); }
  .run-summary__evidence { margin-top: 18px; }
  .run-summary--passed { --summary-accent: var(--run-passed, #079447); }
  .run-summary--active { --summary-accent: var(--run-running, #2563eb); }
  .run-summary--ready { --summary-accent: #8b93a0; }
  .run-summary--queued { --summary-accent: #59616e; }
  .run-summary--provisioning { --summary-accent: #3a4250; }
  .run-summary--flaky { --summary-accent: #4eada3; }
  .run-summary--attention { --summary-accent: var(--run-failed, #c4372d); }
  .run-summary--error { --summary-accent: #ffe500; }
  .run-summary--mocked { --summary-accent: #e09b14; }
  .run-summary--neutral { --summary-accent: #737373; }
  .run-summary__heading { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
  .run-summary__mark { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border: 0; background: color-mix(in srgb, var(--summary-accent) 9%, var(--surface)); color: var(--summary-accent); box-shadow: none; }
  .run-summary__mark svg { width: 22px; height: 22px; }
  .run-summary__identity { min-width: 0; }
  .run-summary__eyebrow { display: block; margin-bottom: 5px; font: 600 12px / 1.3 var(--font-mono); letter-spacing: .09em; text-transform: uppercase; color: var(--muted); }
  .run-summary h2 { margin: 0; font: 600 14px / 1.35 var(--font-display); letter-spacing: -.02em; overflow-wrap: break-word; }
  .run-summary__stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; margin: 0; border: 1px solid var(--line-soft); background: var(--line-soft); }
  .run-summary__stat { min-width: 0; padding: 12px 10px; background: var(--surface); }
  .run-summary__stat dt { margin-bottom: 8px; color: var(--muted); font: 600 12px / 1.3 var(--font-mono); letter-spacing: .05em; text-transform: uppercase; }
  .run-summary__stat dd { margin: 0; font: 600 22px / 1.2 var(--font-mono); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .run-summary__stat--passed dd { color: var(--success); }
  .run-summary__stat.has-issues dd { color: var(--danger); }
  @container run-summary (max-width: 360px) {
    .run-summary__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>
