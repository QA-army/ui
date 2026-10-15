<script lang="ts">
  import ConsolePanel from './ConsolePanel.svelte';
  import NetworkPanel from './NetworkPanel.svelte';
  import RunScreenshots from './RunScreenshots.svelte';
  import { projectNetworkRequests } from './network-evidence';
  import type { RunClient, RunEvent, BrowserDebuggerRecord, BrowserMetrics } from './model';
  import type { TranscriptPlanStep } from './run-transcript';
  let { runs, runId, terminal, events, selectedStepId, viewport = null, planSteps = [], onSelect }: {
    runs: RunClient; runId: string; terminal: boolean; events: readonly RunEvent[];
    selectedStepId: string | null; viewport?: { width: number; height: number } | null; planSteps?: readonly TranscriptPlanStep[]; onSelect: (eventId: string) => void;
  } = $props();
  type Panel = 'console' | 'network' | 'screengraph' | 'metrics';
  type DebuggerPanel = 'console' | 'network';
  const panels: readonly Panel[] = ['console', 'network', 'screengraph', 'metrics'];
  const labels: Record<Panel, string> = { console: 'Console', network: 'Network', screengraph: 'Screengraph', metrics: 'Metrics' };
  let panel = $state<Panel>('console');
  let debuggerRecords = $state.raw<Record<DebuggerPanel, readonly BrowserDebuggerRecord[] | null>>({ console: null, network: null });
  let debuggerFailures = $state.raw<Record<DebuggerPanel, string | null>>({ console: null, network: null });
  let metricsFailure = $state<string | null>(null);
  let evidenceRetry = $state(0);
  let networkRows = $derived(projectNetworkRequests(debuggerRecords.network ?? []));
  let records = $derived(panel === 'console' || panel === 'network' ? debuggerRecords[panel] : null);
  let panelFailure = $derived(panel === 'metrics' ? metricsFailure : panel === 'console' || panel === 'network' ? debuggerFailures[panel] : null);
  let metrics = $state.raw<BrowserMetrics | null>(null);
  let updatesPaused = $state(false);
  let loadedRun = '';
  let acceptedRevision = -1;
  let hasActivity = $derived(terminal || events.length > 0);
  // Keep the last accepted snapshot visible during refresh/reconnect. The service
  // adapter owns transport, authorization and redaction; UI never assumes completion.
  $effect(() => {
    const client = runs, id = runId, final = terminal, started = hasActivity; evidenceRetry;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (loadedRun !== id) {
      loadedRun = id;
      acceptedRevision = -1;
      debuggerRecords = { console: null, network: null }; metrics = null;
    }
    debuggerFailures = { console: null, network: null }; updatesPaused = false;
    if (final) for (const type of ['console', 'network'] as const) {
      void client.loadDebugger(id, type).then(value => {
        if (active) debuggerRecords = { ...debuggerRecords, [type]: value };
      }).catch(error => {
        if (active) debuggerFailures = { ...debuggerFailures, [type]: error instanceof Error ? error.message : 'Activity is unavailable.' };
      });
    }
    if (!started) debuggerRecords = { console: [], network: [] };
    if (!final && started) {
      const read = client.readActivity?.bind(client);
      if (!read) {
        debuggerFailures = { console: 'Live activity is unavailable. Try again.', network: 'Live activity is unavailable. Try again.' };
        metricsFailure = 'Live metrics are unavailable. Try again.';
      } else {
        async function update() {
          try {
            const snapshot = await read!(id);
            if (!active) return;
            if (snapshot.runId !== id || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0) throw new Error('Invalid activity snapshot');
            if (snapshot.revision >= acceptedRevision) {
              acceptedRevision = snapshot.revision;
              debuggerRecords = { console: snapshot.console, network: snapshot.network };
              metrics = snapshot.metrics;
            }
            debuggerFailures = { console: null, network: null }; metricsFailure = null; updatesPaused = false;
          } catch {
            if (active) updatesPaused = true;
          } finally {
            if (active) timer = setTimeout(() => { void update(); }, 1500);
          }
        }
        void update();
      }
    }
    return () => { active = false; clearTimeout(timer); };
  });
  $effect(() => {
    const client = runs, id = runId, selectedPanel = panel, final = terminal; evidenceRetry;
    let active = true;
    if (!final) return;
    metricsFailure = null;
    if (final && selectedPanel === 'metrics') void client.loadMetrics(id).then(value => { if (active) metrics = value; })
      .catch(error => { if (active) metricsFailure = error instanceof Error ? error.message : 'Metrics are unavailable.'; });
    return () => { active = false; };
  });

  function keyboard(event: KeyboardEvent, current: Panel) {
    const index = panels.indexOf(current);
    const next = event.key === 'Home' ? panels[0] : event.key === 'End' ? panels.at(-1) : event.key === 'ArrowRight' ? panels[(index + 1) % panels.length] : event.key === 'ArrowLeft' ? panels[(index - 1 + panels.length) % panels.length] : undefined;
    if (next) { event.preventDefault(); panel = next; document.getElementById(`browser-evidence-tab-${next}`)?.focus(); }
  }
</script>
<section class="run-evidence" aria-label="Run diagnostic evidence">
  <div class="browser-media__tabs" role="tablist" aria-label="Browser evidence">
    {#each panels as name (name)}
      <button id="browser-evidence-tab-{name}" role="tab" aria-label={labels[name]} aria-describedby={name === 'console' || name === 'network' ? `browser-evidence-count-${name}` : undefined} aria-controls="browser-evidence-panel-{name}" aria-selected={panel === name} tabindex={panel === name ? 0 : -1} onclick={() => panel = name} onkeydown={event => keyboard(event, name)}>
        {labels[name]}
        {#if name === 'console' || name === 'network'}<span class="browser-tab-count" aria-hidden="true">{debuggerRecords[name] ? name === 'network' ? networkRows.length : debuggerRecords[name].length : debuggerFailures[name] ? '!' : '—'}</span>{/if}
      </button>
    {/each}
  </div>
  <!-- Status captions such as "Live activity" and "Updates interrupted. Reconnecting…" stay out of the page. A running Run already shows Console and Network counts; reconnect copy stays inside the open panel. -->
  {#each ['console', 'network'] as name (name)}
    <span class="visually-hidden" id="browser-evidence-count-{name}">{debuggerRecords[name as DebuggerPanel] ? `${name === 'network' ? networkRows.length : debuggerRecords.console?.length} captured ${name === 'network' ? 'requests' : 'events'}` : debuggerFailures[name as DebuggerPanel] ? 'Evidence unavailable' : 'Count not yet available'}</span>
  {/each}
  {#each panels as name (name)}
    <div id="browser-evidence-panel-{name}" role="tabpanel" aria-labelledby="browser-evidence-tab-{name}" hidden={panel !== name} tabindex={panel === name ? 0 : -1}>
      {#if panel === name}
        {#if name === 'screengraph'}
          <RunScreenshots {runs} {runId} {events} {terminal} {viewport} {planSteps} title="Screengraph" graph {selectedStepId} {onSelect} />
        {:else if panelFailure}<p role="alert">{panelFailure}</p><button class="evidence-retry" onclick={() => { evidenceRetry += 1; }}>Retry evidence</button>
        {:else if name === 'metrics'}
          {#if metrics}<dl class="browser-metrics"><div><dt>Total credits</dt><dd>{metrics.creditsUsed ?? 'Not reported'}</dd></div><div><dt>Browser time</dt><dd>{metrics.browserTimeCreditsUsed ?? 'Not reported'}</dd></div><div><dt>Proxy data</dt><dd>{metrics.proxyDataCreditsUsed ?? 'Not reported'}</dd></div></dl>{:else}<p role="status">{!hasActivity ? 'No metrics yet.' : updatesPaused ? 'Metrics are temporarily unavailable.' : 'Loading metrics…'}</p>{/if}
        {:else if records === null}<p role="status">{updatesPaused ? 'Activity is temporarily unavailable.' : 'Loading activity…'}</p>
        {:else if name === 'network'}<NetworkPanel rows={networkRows} />
        {:else}<ConsolePanel {records} />{/if}
      {/if}
    </div>
  {/each}
</section>
<style>
  .run-evidence { height: 100%; min-height: 0; display: flex; flex-direction: column; background: var(--surface-raised); }
  .browser-media__tabs { flex-shrink: 0; display: flex; flex-wrap: wrap; margin: 0; padding: 0 8px; border-bottom: 1px solid var(--line-soft); background: var(--paper-soft); }
  .browser-media__tabs button { display: inline-flex; align-items: center; gap: 5px; min-height: 40px; padding: 8px 10px; font: 600 12px var(--font-mono); background: transparent; color: var(--muted); text-transform: uppercase; }
  .browser-media__tabs button[aria-selected='true'] { color: var(--ink); background: var(--surface-raised); }
  .browser-tab-count { font-size: 10px; font-weight: 400; }
  [role='tabpanel']:not([hidden]) { flex: 1; min-height: 0; overflow: auto; padding: 0 12px 12px; }
  [role='tabpanel'] > p { color: var(--muted); font-size: 12px; line-height: 1.6; }
  .evidence-retry { padding: 8px 12px; background: var(--ink); color: var(--bg); }
  @media (max-width: 900px) { .run-evidence { height: auto; min-height: 230px; } .browser-media__tabs { padding: 0; flex-wrap: nowrap; } .browser-media__tabs button { flex: 1; min-width: 0; min-height: 44px; padding-inline: 6px; font-size: 11px; } [role='tabpanel']:not([hidden]) { max-height: 320px; } }
</style>
