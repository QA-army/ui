<script lang="ts">
  import ConsolePanel from './ConsolePanel.svelte';
  import NetworkPanel from './NetworkPanel.svelte';
  import RunScreenshots from './RunScreenshots.svelte';
  import { projectNetworkRequests } from './network-evidence';
  import type { RunClient, RunEvent, BrowserDebuggerRecord, BrowserMetrics, EvidencePanel, RunMetric } from './model';
  import type { TranscriptPlanStep } from './run-transcript';
  const defaultPanels: readonly EvidencePanel[] = [
    { id: 'console', label: 'Console' },
    { id: 'network', label: 'Network' },
    { id: 'screengraph', label: 'Screengraph' },
    { id: 'metrics', label: 'Metrics' },
  ];
  let { runs, runId, terminal, events, selectedStepId, viewport = null, planSteps = [], onSelect, panels = defaultPanels, suppliedMetrics = null }: {
    runs: RunClient; runId: string; terminal: boolean; events: readonly RunEvent[];
    selectedStepId: string | null; viewport?: { width: number; height: number } | null; planSteps?: readonly TranscriptPlanStep[]; onSelect: (eventId: string) => void;
    panels?: readonly EvidencePanel[]; suppliedMetrics?: readonly RunMetric[] | null;
  } = $props();
  type Panel = EvidencePanel['id'];
  type DebuggerPanel = 'console' | 'network';
  let panel = $state<Panel>('console');
  let visiblePanel = $derived(panels.some(item => item.id === panel) ? panel : panels[0]?.id ?? 'console');
  let debuggerRecords = $state.raw<Record<DebuggerPanel, readonly BrowserDebuggerRecord[] | null>>({ console: null, network: null });
  let debuggerFailures = $state.raw<Record<DebuggerPanel, string | null>>({ console: null, network: null });
  let metricsFailure = $state<string | null>(null);
  let evidenceRetry = $state(0);
  let networkRows = $derived(projectNetworkRequests(debuggerRecords.network ?? []));
  let records = $derived(visiblePanel === 'console' || visiblePanel === 'network' ? debuggerRecords[visiblePanel] : null);
  let panelFailure = $derived(visiblePanel === 'metrics' ? metricsFailure : visiblePanel === 'console' || visiblePanel === 'network' ? debuggerFailures[visiblePanel] : null);
  let metrics = $state.raw<BrowserMetrics | null>(null);
  let updatesPaused = $state(false);
  let loadedRun = '';
  let acceptedRevision = -1;
  let hasActivity = $derived(terminal || events.length > 0);
  // Keep the last accepted snapshot visible during refresh/reconnect. The service
  // adapter owns transport, authorization and redaction; UI never assumes completion.
  $effect(() => {
    const client = runs, id = runId, final = terminal, started = hasActivity, hostMetrics = suppliedMetrics;
    const enabled = new Set(panels.map(item => item.id)); evidenceRetry;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (loadedRun !== id) {
      loadedRun = id;
      acceptedRevision = -1;
      debuggerRecords = { console: null, network: null }; metrics = null;
    }
    debuggerFailures = { console: null, network: null }; updatesPaused = false;
    if (final) for (const type of ['console', 'network'] as const) {
      if (!enabled.has(type)) continue;
      void client.loadDebugger(id, type).then(value => {
        if (active) debuggerRecords = { ...debuggerRecords, [type]: value };
      }).catch(error => {
        if (active) debuggerFailures = { ...debuggerFailures, [type]: error instanceof Error ? error.message : 'Activity is unavailable.' };
      });
    }
    if (!started) debuggerRecords = { console: [], network: [] };
    const wantsLive = enabled.has('console') || enabled.has('network') || (enabled.has('metrics') && !hostMetrics);
    if (!final && started && wantsLive) {
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
    const client = runs, id = runId, selectedPanel = visiblePanel, final = terminal, hostMetrics = suppliedMetrics, showMetrics = panels.some(item => item.id === 'metrics'); evidenceRetry;
    let active = true;
    metricsFailure = null;
    if (final && !hostMetrics && showMetrics && selectedPanel === 'metrics') void client.loadMetrics(id).then(value => { if (active) metrics = value; })
      .catch(error => { if (active) metricsFailure = error instanceof Error ? error.message : 'Metrics are unavailable.'; });
    return () => { active = false; };
  });

  function keyboard(event: KeyboardEvent, current: Panel) {
    const ids = panels.map(item => item.id);
    const index = ids.indexOf(current);
    const next = event.key === 'Home' ? ids[0] : event.key === 'End' ? ids.at(-1) : event.key === 'ArrowRight' ? ids[(index + 1) % ids.length] : event.key === 'ArrowLeft' ? ids[(index - 1 + ids.length) % ids.length] : undefined;
    if (next) { event.preventDefault(); panel = next; document.getElementById(`browser-evidence-tab-${next}`)?.focus(); }
  }
</script>
<section class="run-evidence" aria-label="Run diagnostic evidence">
  <div class="browser-media__tabs" role="tablist" aria-label="Run evidence">
    {#each panels as item (item.id)}
      <button id="browser-evidence-tab-{item.id}" role="tab" aria-label={item.label} aria-describedby={item.id === 'console' || item.id === 'network' ? `browser-evidence-count-${item.id}` : undefined} aria-controls="browser-evidence-panel-{item.id}" aria-selected={visiblePanel === item.id} tabindex={visiblePanel === item.id ? 0 : -1} onclick={() => panel = item.id} onkeydown={event => keyboard(event, item.id)}>
        {item.label}
        {#if item.id === 'console' || item.id === 'network'}<span class="browser-tab-count" aria-hidden="true">{debuggerRecords[item.id] ? item.id === 'network' ? networkRows.length : debuggerRecords[item.id].length : debuggerFailures[item.id] ? '!' : '—'}</span>{/if}
      </button>
    {/each}
  </div>
  {#each panels as item (item.id)}
    {#if item.id === 'console' || item.id === 'network'}
      <span class="visually-hidden" id="browser-evidence-count-{item.id}">{debuggerRecords[item.id] ? `${item.id === 'network' ? networkRows.length : debuggerRecords[item.id].length} captured ${item.id === 'network' ? 'requests' : 'events'}` : debuggerFailures[item.id] ? 'Evidence unavailable' : 'Count not yet available'}</span>
    {/if}
  {/each}
  {#each panels as item (item.id)}
    <div id="browser-evidence-panel-{item.id}" role="tabpanel" aria-labelledby="browser-evidence-tab-{item.id}" hidden={visiblePanel !== item.id} tabindex={visiblePanel === item.id ? 0 : -1}>
      {#if visiblePanel === item.id}
        {#if item.id === 'screengraph'}
          <RunScreenshots {runs} {runId} {events} {terminal} {viewport} {planSteps} title="Screengraph" graph {selectedStepId} {onSelect} />
        {:else if panelFailure}<p role="alert">{panelFailure}</p><button class="evidence-retry" onclick={() => { evidenceRetry += 1; }}>Retry evidence</button>
        {:else if item.id === 'metrics'}
          {#if suppliedMetrics}<dl class="browser-metrics">{#each suppliedMetrics as metric, index (index)}<div><dt>{metric.label}</dt><dd>{metric.value}</dd></div>{/each}</dl>
          {:else if metrics}<dl class="browser-metrics"><div><dt>Total credits</dt><dd>{metrics.creditsUsed ?? 'Not reported'}</dd></div><div><dt>Browser time</dt><dd>{metrics.browserTimeCreditsUsed ?? 'Not reported'}</dd></div><div><dt>Proxy data</dt><dd>{metrics.proxyDataCreditsUsed ?? 'Not reported'}</dd></div></dl>
          {:else}<p role="status">{!hasActivity ? 'No metrics yet.' : updatesPaused ? 'Metrics are temporarily unavailable.' : 'Loading metrics…'}</p>{/if}
        {:else if records === null}<p role="status">{updatesPaused ? 'Activity is temporarily unavailable.' : 'Loading activity…'}</p>
        {:else if item.id === 'network'}<NetworkPanel rows={networkRows} />
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
