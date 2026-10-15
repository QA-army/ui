<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import '../showcase/tokens.css';
  import './run-design-tokens.css';
  import './run-workbench.css';
  import './run-page.css';
  import OutcomeIcon from './OutcomeIcon.svelte';
  import type { EvidencePanel, RunClient, RunMetric, RunPageState, RunTest } from './model';
  import { projectRunTimeline, projectTranscript, type TranscriptStep } from './run-transcript';
  import { finalDuration, formatDate, formatDuration, isTerminalStatus, resultSummary } from './run-detail-model';
  import RunMedia from './RunMedia.svelte';
  import RunEvidence from './RunEvidence.svelte';
  import RunSplit from './RunSplit.svelte';
  import RunOverlay from './RunOverlay.svelte';
  import RunSummary from './RunSummary.svelte';
  import RunFeedback from './RunFeedback.svelte';
  import StepKindBadge from './StepKindBadge.svelte';
  import ShareRun from './ShareRun.svelte';
  import RunScreenshots from './RunScreenshots.svelte';

  let { page, test = null, client, shareUrl = null, onClose, onRefresh, onRerun, onCancel, productName = 'QA.army', themeStorageKey = 'qa-army-ui-theme', hasRecording = true, panels = undefined, metrics = undefined, details, issues }: {
    page: RunPageState; test?: RunTest | null; client: RunClient; shareUrl?: string | null;
    onClose: () => void; onRefresh: () => void;
    onRerun?: () => Promise<void>; onCancel?: () => Promise<void>;
    productName?: string; themeStorageKey?: string; hasRecording?: boolean;
    panels?: readonly EvidencePanel[]; metrics?: readonly RunMetric[];
    details?: Snippet; issues?: Snippet;
  } = $props();
  let selection = $state<{ eventId: string | null; seekVersion: number }>({ eventId: null, seekVersion: 0 });
  let expanded = $state<Record<string, boolean>>({});
  let hoveredStepId = $state<string | null>(null);
  let focusedStepId = $state<string | null>(null);
  const latchedOpen = new SvelteSet<string>();
  function stepOpen(step: TranscriptStep) {
    return expanded[step.stepId] ?? latchedOpen.has(step.stepId);
  }
  function iconOnlyOutcome(outcome: string, label: string) {
    return outcome === 'PASSED' || outcome === 'FAILED' || outcome === 'ERROR' || label === 'UNEXECUTED' || label === 'QUEUED';
  }
  function quietMotion() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  let cancelling = $state(false);
  let cancelError = $state<string | null>(null);
  let rerunning = $state(false);
  let rerunError = $state<string | null>(null);
  let themeChoice = $state<'light' | 'dark' | null>(null);
  let theme = $derived.by(() => {
    if (themeChoice) return themeChoice;
    const stored = window.localStorage.getItem(themeStorageKey);
    if (stored === 'dark' || stored === 'light') return stored;
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  });
  $effect(() => {
    document.documentElement.dataset.theme = theme;
  });
  let recording = $state<{ runId: string; url: string | null; mediaType: string; error: string | null } | null>(null);
  const receiveRecording = (value: NonNullable<typeof recording>) => { recording = value; };
  let active = true;
  onDestroy(() => { active = false; });
  let run = $derived(page.kind === 'ready' ? page.run : null);
  $effect(() => {
    if (!run) return;
    const previousTitle = document.title;
    document.title = `${test?.name ?? 'Test Run'} · ${run.status} · ${productName}`;
    return () => { document.title = previousTitle; };
  });
  let prerequisites = $derived(run?.journey?.unresolved_prerequisites.map(message => ({ message })) ?? []);
  let events = $derived(page.kind === 'ready' ? page.events : []);
  let terminal = $derived(run ? isTerminalStatus(run.status) : false);
  let summaryRecording = $derived(terminal && recording?.runId === run?.id ? recording : null);
  let steps = $derived(projectTranscript(events, test?.steps));
  // A running step, and a step whose latest attempt failed or errored, opens itself.
  // The latch is recorded after render. It stays open until the person closes it.
  // A manual close sticks across refresh. Passed steps stay collapsed.
  $effect(() => {
    for (const step of steps) {
      const latest = step.attempts.at(-1)?.outcome;
      if (latest === 'STARTED' || latest === 'FAILED' || latest === 'ERROR') latchedOpen.add(step.stepId);
    }
  });
  let notes = $derived(new Map((test?.steps ?? []).flatMap(step => step.note ? [[step.id, step.note] as const] : [])));
  let timeline = $derived(projectRunTimeline(events));
  let selectedId = $derived.by(() => {
    const chosen = events.find(event => event.eventId === selection.eventId);
    const latest = timeline.at(-1);
    if (!terminal && latest && chosen?.correlation.stepId !== latest.stepId) return latest.eventId;
    return chosen?.eventId ?? (terminal ? (timeline.find(step => step.outcome === 'FAILED' || step.outcome === 'ERROR') ?? timeline[0])?.eventId : latest?.eventId) ?? null;
  });
  let recordedViewport = $derived.by(() => {
    const event = [...events].reverse().find(event => event.kind === 'browser.state' && Number.isInteger(event.safePayload.viewport_width) && Number.isInteger(event.safePayload.viewport_height));
    return event ? { width: Number(event.safePayload.viewport_width), height: Number(event.safePayload.viewport_height) } : null;
  });
  let selectedEvent = $derived(events.find(event => event.eventId === selectedId));
  let result = $derived(resultSummary(events, steps));
  let duration = $derived(finalDuration(events));
  const select = (eventId: string) => { selection = { eventId, seekVersion: selection.seekVersion + 1 }; };
  const follow = (eventId: string) => { selection = { ...selection, eventId }; };
  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    themeChoice = next;
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem(themeStorageKey, next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#f2efe9' : '#0b0b0e');
  }
  async function cancel() {
    if (!run || cancelling || !onCancel) return;
    cancelling = true; cancelError = null;
    try { await onCancel?.(); if (active) onRefresh(); }
    catch (error) { if (active) cancelError = error instanceof Error ? error.message : 'Run cancellation failed.'; }
    finally { if (active) cancelling = false; }
  }
  async function rerun() {
    if (!run || !terminal || rerunning || !onRerun || test?.enabled === false) return;
    rerunning = true; rerunError = null;
    try { await onRerun(); }
    catch { if (active) rerunError = 'Could not create a new Run. Try again.'; }
    finally { if (active) rerunning = false; }
  }
</script>

<RunOverlay title={test?.name ? `${test.name} · Run` : 'Test Run'} onClose={onClose}>
{#if page.kind === 'loading'}
  <main class="callback-page"><p role="status">Loading Run transcript…</p></main>
{:else if page.kind === 'error'}
  <main class="callback-page"><h1>{page.forbidden ? 'Run access denied' : 'Run unavailable'}</h1><p role="alert">{page.message}</p><button class="button button--primary" type="button" onclick={onRefresh}>Try again</button><button class="button" type="button" onclick={onClose}>Close</button></main>
{:else if run}
  <div class="run-shell" data-renderer="svelte">
    <header class="run-header">
      <div class="run-header__identity"><span class="run-status-dot run-status-dot--{run.status.toLowerCase()}" aria-hidden="true"></span><div><div class="run-title-row"><h1 id="run-title">{test?.name ?? 'Test Run'}</h1><ShareRun url={shareUrl} shareTitle={`${test?.name ?? 'Test Run'} · ${run.status} · ${productName}`} /></div><p>{formatDate(run.resolvedAt)}</p>{#if details}<div class="run-provenance">{@render details()}</div>{/if}</div></div>
      <div class="run-header__actions">
        <!-- Rerun and Stop Test are the rightmost header controls.
             Passed, Failed, and Error sit to the left of the elapsed time.
             Ready, Syncing, and Reconnecting keep a quiet status. A healthy Live run does not.
             While the run is in progress the elapsed time is green and blinks on its own. No dot beside it.
             The header does not show a RUNNING badge. -->
        {#if page.connection === 'reconnecting' || page.connection === 'refreshing' || (!terminal && run.status === 'READY')}
        <div class="run-header__execution">
          <span class="run-connection run-connection--{page.connection}" role="status"><i aria-hidden="true"></i>{page.connection === 'reconnecting' ? 'Reconnecting' : page.connection === 'refreshing' ? 'Syncing' : 'Ready'}</span>
        </div>
        {/if}
        {#if run.status !== 'RUNNING'}<strong class="run-badge run-badge--{run.status.toLowerCase()}">{run.status}</strong>{/if}<strong class="run-header__duration" class:run-header__duration--live={!terminal && run.status !== 'READY'}>{formatDuration(duration)}</strong>
        {#if terminal}<button class="run-header-cta run-rerun" title={test?.enabled === false ? 'Enable this Test to rerun it' : 'Run the latest saved Test again'} onclick={rerun} disabled={rerunning || !onRerun || test?.enabled === false} aria-describedby={rerunError ? 'run-rerun-error' : undefined}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg><span aria-live="polite">{rerunning ? 'Starting…' : 'Rerun'}</span></button>
        {:else if run.status !== 'READY'}<button class="run-header-cta run-stop" onclick={cancel} disabled={cancelling || !onCancel || Boolean(run.cancellationRequestedAt)} aria-describedby={cancelError ? 'run-cancel-error' : undefined}><span aria-hidden="true">■</span><span aria-live="polite">{cancelling || run.cancellationRequestedAt ? 'Stopping…' : 'Stop Test'}</span></button>{/if}
      </div>
    </header>
    {#if cancelError}<div id="run-cancel-error" class="run-cancel-error" role="alert">{cancelError}</div>{/if}
    {#if rerunError}<div id="run-rerun-error" class="run-cancel-error" role="alert">{rerunError}</div>{/if}
    {#if page.warning}<div class="run-connection-warning" role="status">{page.warning}</div>{/if}
    <main class="run-workbench" aria-labelledby="run-title">
      <RunSplit label="Resize transcript and browser columns" initial={45} minimum={25} maximum={65}>
      {#snippet first()}
      <section class="run-transcript-pane" aria-label="Trusted Run transcript">
        <div class="run-transcript-heading">
          <strong>Execution Transcript</strong><span>{steps.length} steps</span><span class="run-transcript-heading__time">{formatDuration(duration)}</span>
        </div>
        {#if steps.length === 0}<div class="run-empty"><h2>{terminal ? 'No journey steps recorded' : 'Waiting for journey steps'}</h2><p>{terminal ? 'This Run ended without a recorded step result. Its final status is shown below.' : 'The trusted transcript will appear when execution starts.'}</p></div>{/if}
        {#if run.journey}<details class="journey-details">
          <summary>Journey sources and identities</summary>
          <p>{run.journey.goal}</p><p>Source steps describe existing Tests. Each Run checks the behavior again.</p>
          <ul>{#each run.journey.sources as source (source.fragment_id)}<li>Source Test · version {source.test_version} · {source.primitive}</li>{/each}</ul>
          {#each run.journey.bindings as binding (binding.name)}<fieldset><legend>Observe {binding.name}</legend><p>Step {binding.source_position + 1}: {binding.query}</p></fieldset>{/each}
          {#each run.journey.binding_checks as check (check)}<fieldset><legend>Verify {check.binding}</legend><p>Step {check.position + 1}: {check.query}</p></fieldset>{/each}
          {#if run.journey.unresolved_prerequisites.length}<div role="alert"><strong>Resolve before running</strong><ul>{#each prerequisites as prerequisite (prerequisite)}<li>{prerequisite.message}</li>{/each}</ul></div>{/if}
          <details><summary>How steps connect</summary><ol>{#each run.journey.steps as journeyStep (journeyStep.position)}<li>{journeyStep.inferred_connection ?? 'Adapted from the cited source step.'}</li>{/each}</ol></details>
        </details>{/if}
        <ol class="transcript-steps">
          {#each steps as step (step.stepId)}
            {@const attempt = step.attempts.at(-1)}
            {@const isExpanded = stepOpen(step)}
            {@const engaged = hoveredStepId === step.stepId || focusedStepId === step.stepId}
            {@const actionReveal = engaged ? (quietMotion() ? 'full' : 'type') : 'icon'}
            {@const outcome = attempt?.outcome ?? (step.enabled ? 'Waiting' : 'SKIPPED')}
            {@const outcomeLabel = !step.enabled && !attempt ? 'DISABLED (EDITOR)'
              : outcome === 'STARTED' ? 'RUNNING'
              : outcome === 'Waiting' ? (terminal ? 'UNEXECUTED' : run.status === 'READY' ? 'READY' : 'QUEUED') : outcome}
            <li class={step.stepId === selectedEvent?.correlation.stepId ? 'is-selected' : ''} onmouseenter={() => { hoveredStepId = step.stepId; }} onmouseleave={() => { if (hoveredStepId === step.stepId) hoveredStepId = null; }}>
              <div class="transcript-step-row">
                <button class="transcript-step" aria-expanded={isExpanded} onclick={() => { expanded[step.stepId] = !isExpanded; }} onfocus={() => { focusedStepId = step.stepId; }} onblur={() => { if (focusedStepId === step.stepId) focusedStepId = null; }}>
                  <span class="transcript-step__number">{step.position}</span>
                  <span class="transcript-step__content"><StepKindBadge type={step.stepType} reveal={actionReveal} /><span class="transcript-step__title" class:is-pending={outcome === 'Waiting' || outcome === 'SKIPPED'}>{step.title}</span>{#if notes.get(step.stepId)}<span class="step-note">{notes.get(step.stepId)}</span>{/if}</span>
                  <!-- Passed, failed, error, unexecuted, and queued are the square only. The word stays for assistive tech. -->
                  <span class="step-outcome step-outcome--{outcome.toLowerCase()}" class:step-outcome--mark={iconOnlyOutcome(outcome, outcomeLabel)}><OutcomeIcon outcome={outcomeLabel === 'UNEXECUTED' ? 'UNEXECUTED' : outcome === 'Waiting' ? outcomeLabel : outcome} />{#if iconOnlyOutcome(outcome, outcomeLabel)}<span class="visually-hidden">{outcomeLabel}</span>{:else}{outcomeLabel}{/if}</span>
                </button>
                {#if attempt?.replayOffsetMs !== null && attempt?.replayOffsetMs !== undefined}<button class="transcript-step__seek" aria-label="Go to {formatDuration(attempt.replayOffsetMs)}" onclick={() => select(attempt.startedEventId)}>▶ {formatDuration(attempt.replayOffsetMs)}</button>{/if}
              </div>
              {#if isExpanded}<div class="transcript-attempts">
                {#if step.attempts.length === 0}<section class="transcript-attempt" aria-label={`Step ${step.position} ${step.enabled ? (terminal ? "unexecuted" : "waiting") : "disabled"}`}><p>{!step.enabled ? 'Disabled in the Test editor' : terminal ? 'This step was not executed.' : 'Waiting…'}</p></section>{/if}
                {#each step.attempts as candidate (candidate.attempt)}
                  <section class="transcript-attempt" aria-label="Attempt {candidate.attempt}">
                    <div class="attempt-divider"><span>Attempt {candidate.attempt}</span><span>{candidate.activities.length} {candidate.activities.length === 1 ? 'substep' : 'substeps'} · {candidate.outcome === 'STARTED' ? 'Running' : candidate.outcome ?? 'Pending'}</span></div>
                    <ul>{#each candidate.activities as activity (activity.id)}<li><button class={activity.eventId === selectedId ? 'is-selected' : ''} onclick={() => select(activity.eventId)}>
                      <span class="activity-branch" aria-hidden="true"></span><span>{activity.label}
                        {#if activity.verification}<span class="verification-detail">
                          {#if activity.verification.journey}<span>{[...activity.verification.journey.captured.map(binding => `Observed ${binding.name}: ${String(binding.value)}`), ...activity.verification.journey.checked.map(binding => `Checked ${binding.name}: ${String(binding.value)}`)].join(' · ')}</span>{/if}
                          <span>Expected{activity.verification.inferred ? ' (inferred before execution)' : ''}: {activity.verification.expectation}</span>{#if activity.verification.observed}<span>Observed: {activity.verification.observed}</span>{/if}</span>{/if}
                      </span><small>{activity.replayOffsetMs === null ? '—' : formatDuration(activity.replayOffsetMs)}</small>
                    </button></li>{/each}
                    {#if candidate.outcome === 'STARTED'}<li class="transcript-waiting"><span aria-hidden="true"></span><em>Waiting…</em></li>{/if}</ul>
                  </section>
                {/each}
              </div>{/if}
            </li>
          {/each}
        </ol>
      <div class="run-summary-pane">
        <RunSummary status={run.status} passedSteps={result.passedSteps} failedSteps={result.failedSteps} errorSteps={result.errorSteps} elapsedMs={duration}>
          {#snippet footer()}
          <div class="run-footer-actions">
            <button class="theme-toggle" aria-label="Use {theme === 'light' ? 'dark' : 'light'} mode" title={theme === 'light' ? 'Use dark mode' : 'Use light mode'} onclick={toggleTheme}><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" /></svg></button>
            {#key run.id}<RunFeedback runs={client} runId={run.id} {terminal} />{/key}
          </div>
          {/snippet}
          {#if issues}<div class="run-issues">{@render issues()}</div>{/if}
          <RunScreenshots runs={client} runId={run.id} {events} {terminal} viewport={recordedViewport} planSteps={test?.steps ?? []} />
          <section class="run-recording-download" aria-label="Video recording evidence">
            <strong>Video recording</strong>
            {#if !hasRecording}
              <p>This run records screenshots and does not include a video.</p>
            {:else if summaryRecording?.url}
              <div class="run-recording-attachment">
                <span class="run-recording-attachment__file">
                  <span>Full-Chrome recording</span>
                  <small>{summaryRecording.mediaType === 'video/webm' ? 'WebM' : 'MP4'}</small>
                </span>
                <span class="run-evidence-actions">
                  <a href={summaryRecording.url} target="_blank" rel="noreferrer" aria-label="View Run video recording">View</a>
                  <a href={summaryRecording.url} download={`${run.id}-recording.${summaryRecording.mediaType === 'video/webm' ? 'webm' : 'mp4'}`} aria-label="Download Run video recording">Download</a>
                </span>
              </div>
            {:else}<p>{!terminal ? 'Follow this Run in the browser view.' : summaryRecording?.error ? 'Recording unavailable. See Replay for details and retry.' : 'Loading recording…'}</p>{/if}
          </section>
        </RunSummary>
      </div>
      </section>
      {/snippet}
      {#snippet second()}
      <RunSplit label="Resize browser evidence and Screengraph" direction="horizontal" initial={55} minimum={30} maximum={85}>
      {#snippet first()}
      <section class="run-visual-pane" aria-label={terminal && !hasRecording ? 'Screenshots' : 'Browser Live View, recording replay, and evidence'}>
        {#if terminal && !hasRecording}
          <RunScreenshots runs={client} runId={run.id} {events} {terminal} viewport={recordedViewport} planSteps={test?.steps ?? []} />
        {:else}
          <RunMedia runs={client} runId={run.id} {terminal} liveViewReady={events.some(event => event.kind === 'browser.state' && event.type === 'LIVE_VIEW_READY')} selectedOffsetMs={selectedEvent?.replayOffsetMs ?? null} selectedStepId={selectedEvent?.correlation.stepId ?? null} seekVersion={selection.seekVersion} {timeline} totalSteps={steps.filter(step => step.enabled).length} elapsedMs={duration} viewport={recordedViewport} onSelect={select} onPlayback={follow} onRecording={receiveRecording} />
        {/if}
      </section>
      {/snippet}
      {#snippet second()}
      <section class="run-screengraph-pane" aria-label="Diagnostic panels">
        <RunEvidence runs={client} runId={run.id} {terminal} {events} viewport={recordedViewport} planSteps={test?.steps ?? []} selectedStepId={selectedEvent?.correlation.stepId ?? null} onSelect={select} {panels} suppliedMetrics={metrics} />
      </section>
      {/snippet}
      </RunSplit>
      {/snippet}
      </RunSplit>
    </main>
  </div>
{/if}
</RunOverlay>
<style>
  .run-workbench { display: block; overflow: hidden; }
  .run-transcript-pane, .run-visual-pane, .run-summary-pane, .run-screengraph-pane { min-width: 0; min-height: 0; height: 100%; border: 0; background: var(--surface-raised); }
  .run-transcript-pane { display: flex; flex-direction: column; height: auto; min-height: 100%; overflow: visible; }
  .run-summary-pane { display: flex; flex-direction: column; flex: 1 0 auto; height: auto; overflow: visible; }
  .run-summary-pane :global(.run-summary) { box-sizing: border-box; flex: 1; }
  .run-recording-download { display: flex; flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 0; border-bottom: 1px solid var(--line-soft); }
  .run-recording-download > strong { font: 700 11px var(--font-mono); letter-spacing: .04em; text-transform: uppercase; }
  .run-recording-download p { width: 100%; margin: 0; color: var(--muted); font-size: 12px; }
  .run-recording-attachment { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 8px 10px; border: 1px solid var(--line-soft); background: var(--surface); }
  .run-recording-attachment__file { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .run-recording-attachment__file > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 12px var(--font-mono); }
  .run-recording-attachment__file small { color: var(--muted); font: 11px var(--font-mono); }
  .run-recording-attachment .run-evidence-actions { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
  .run-recording-attachment .run-evidence-actions a { padding: 0; border: 0; background: transparent; color: var(--muted); font: 600 11px var(--font-mono); letter-spacing: .04em; text-transform: uppercase; text-decoration: none; }
  .run-recording-attachment .run-evidence-actions a:hover { color: var(--text); }
  .run-recording-attachment .run-evidence-actions a:focus-visible { outline: 2px solid var(--accent-strong); outline-offset: 2px; }
  @media (max-width: 900px) { .run-recording-attachment .run-evidence-actions a { min-height: 44px; display: inline-flex; align-items: center; } }
  .run-visual-pane { display: block; overflow: visible; }
  @media (max-width: 900px) {
    .run-workbench { overflow: visible; }
    .run-transcript-pane, .run-visual-pane, .run-summary-pane, .run-screengraph-pane { height: auto; }
    .run-workbench > :global(.run-split) > :global(.run-split__pane:last-child) { order: -1; }
    .run-screengraph-pane, :global(.run-split__pane:has(> .run-screengraph-pane)) { display: none; }
  }

  .run-title-row { display: flex; align-items: center; gap: 4px; min-width: 0; }
  .run-provenance, .run-issues, .step-note { color: var(--muted); font: 11px/1.5 var(--font-mono); }
  .run-provenance, .run-issues { margin-top: 6px; }
  .step-note { display: block; }
  .run-footer-actions { display: flex; align-items: center; justify-content: flex-start; gap: 8px; width: max-content; }
  .theme-toggle { display: grid; place-items: center; width: 32px; min-height: 32px; padding: 4px; border: 0; background: transparent; color: var(--muted); box-shadow: none; }
  .theme-toggle:hover { color: var(--text); }
  @media (max-width: 900px) { .theme-toggle { width: 40px; min-height: 44px; } }

  .transcript-step__content { display: block; min-width: 0; line-height: 1.6; }
  .transcript-step__content :global(.step-kind-badge) { margin-inline-end: 6px; vertical-align: middle; }
  .transcript-step__content .transcript-step__title { vertical-align: middle; }
  .run-shell :global(button:focus-visible), .run-shell :global(a:focus-visible), .run-shell :global(summary:focus-visible) { outline: 2px solid var(--accent-strong); outline-offset: 3px; }
  .run-shell :global(button) { min-height: 32px; }
  @media (max-width: 760px) { .run-header { flex-wrap: nowrap; align-items: flex-start; gap: 8px; } .run-header__identity { min-width: 0; flex: 1; } .run-header__identity h1 { max-width: 100%; } .run-header__actions { width: auto; flex: 0 0 auto; flex-wrap: nowrap; justify-content: flex-end; align-self: flex-start; } .run-workbench { display: flex; flex-direction: column; } .run-visual-pane { order: -1; } .run-shell :global(button) { min-height: 44px; } }
</style>
