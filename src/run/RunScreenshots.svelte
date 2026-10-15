<script lang="ts">
  import type { RunClient, RunEvent, RunScreenshot } from './model';
  import { projectTranscript, type TranscriptPlanStep } from './run-transcript';
  import { formatDate, formatDuration } from './run-detail-model';
  let { runs, runId, events, terminal = true, title = 'Screenshots', graph = false, selectedStepId = null, viewport = null, planSteps = [], onSelect }: { runs: RunClient; runId: string; events: readonly RunEvent[]; terminal?: boolean; title?: string; graph?: boolean; selectedStepId?: string | null; viewport?: { width: number; height: number } | null; planSteps?: readonly TranscriptPlanStep[]; onSelect?: (eventId: string) => void } = $props();
  let capturedSteps = $derived(projectTranscript(events, planSteps));
  let retry = $state(0);
  let loading = $state(false);
  let failure = $state<string | null>(null);
  let images = $state.raw<readonly { screenshot: RunScreenshot; url: string }[]>([]);
  let measured = $state<Record<string, { width: number; height: number }>>({});
  let evidenceKey = $derived([...new Set(events.filter(event => event.kind === 'evidence.ready' && event.type === 'CAPTURED' && event.safePayload.evidence_kind === 'SCREENSHOT' && typeof event.safePayload.evidence_id === 'string').map(event => String(event.safePayload.evidence_id)))].join(':'));
  let evidenceIds = $derived(evidenceKey ? evidenceKey.split(':') : []);
  let frameWidth = $derived(viewport?.width && viewport.width > 0 ? viewport.width : 0);
  let frameHeight = $derived(viewport?.height && viewport.height > 0 ? viewport.height : 0);
  function noteSize(image: HTMLImageElement, key: string) {
    const width = image.naturalWidth, height = image.naturalHeight;
    if (width > 0 && height > 0 && (measured[key]?.width !== width || measured[key]?.height !== height)) measured[key] = { width, height };
  }
  function readPixels(node: HTMLImageElement, key: string) {
    const read = () => noteSize(node, key);
    if (node.complete) read();
    node.addEventListener('load', read);
    return { update(next: string) { key = next; read(); }, destroy() { node.removeEventListener('load', read); } };
  }
  function pixels(key: string) {
    const size = measured[key];
    return size ? `${size.width} × ${size.height}` : '';
  }
  function shotAspect(key: string) {
    const size = measured[key];
    return size ? `${size.width} / ${size.height}` : undefined;
  }
  let screenshotSteps = $derived(capturedSteps.filter(step => step.stepType.toUpperCase() === 'SCREENSHOT'));
  let shotCount = $derived(screenshotSteps.length || evidenceIds.length);
  let cards = $derived.by(() => {
    const imageFor = (evidenceId: string | undefined) => images.find(item => item.screenshot.evidence.evidenceId === evidenceId);
    if (screenshotSteps.length) return screenshotSteps.map(step => {
      const capture = events.find(event => event.kind === 'evidence.ready' && event.safePayload.evidence_kind === 'SCREENSHOT' && event.correlation.stepId === step.stepId && typeof event.safePayload.evidence_id === 'string');
      const evidenceId = capture ? String(capture.safePayload.evidence_id) : undefined;
      return { key: step.stepId, stepId: step.stepId, position: step.position, title: step.title, image: imageFor(evidenceId), capture, status: terminal ? 'Not captured' : 'Pending' };
    });
    return images.map((image, index) => {
      const capture = events.find(event => event.kind === 'evidence.ready' && event.safePayload.evidence_id === image.screenshot.evidence.evidenceId);
      const step = capture?.correlation.stepId ? capturedSteps.find(item => item.stepId === capture.correlation.stepId) : undefined;
      return { key: image.screenshot.evidence.evidenceId, stepId: step?.stepId ?? null, position: step?.position ?? null, title: step?.title ?? `Screenshot ${index + 1}`, image, capture, status: '' };
    });
  });
  $effect(() => {
    const client = runs, id = runId, ids = evidenceIds; retry;
    let active = true; const urls: string[] = [];
    images = []; measured = {}; failure = null; loading = false;
    if (ids.length) {
      loading = true;
      void client.loadScreenshots(id, ids).then(screenshots => {
        if (!active) return;
        images = [...screenshots].sort((a, b) => ids.indexOf(a.evidence.evidenceId) - ids.indexOf(b.evidence.evidenceId)).map(screenshot => {
          const url = URL.createObjectURL(new Blob([screenshot.bytes as Uint8Array<ArrayBuffer>], { type: 'image/png' })); urls.push(url); return { screenshot, url };
        });
      }).catch(error => { if (active) failure = error instanceof Error ? error.message : 'Run screenshots are unavailable.'; })
        .finally(() => { if (active) loading = false; });
    }
    return () => { active = false; for (const url of urls) URL.revokeObjectURL(url); };
  });
</script>
{#snippet content()}
  <div class="run-evidence-content" class:is-graph={graph}>

    {#if loading}<p role="status">Loading screenshots…</p>{/if}
    {#if failure}<p role="alert">{failure}</p><button onclick={() => { retry += 1; }}>Try screenshots again</button>
    {:else if cards.length === 0 && !loading}
      <p>{evidenceIds.length ? 'Captured screenshots could not be loaded.' : terminal ? 'No screenshots were captured for this Run.' : 'No screenshots yet.'}</p>
      {#if evidenceIds.length}<button onclick={() => { retry += 1; }}>Try screenshots again</button>{/if}
    {/if}
    {#if cards.length}<ol class="run-evidence-gallery">{#each cards as card, index (card.key)}
      <li class:is-selected={graph && selectedStepId !== null && card.stepId === selectedStepId}><figure>
      {#if card.image}
      <!-- Evidence hashes are verified by the client before rendering. -->
      <figcaption><strong>{card.title}</strong><span>{pixels(card.key) ? `${pixels(card.key)} · ${formatDate(card.image.screenshot.evidence.capturedAt)}` : formatDate(card.image.screenshot.evidence.capturedAt)}</span></figcaption>
      {#if graph}<div class="screen-node-heading"><strong>{card.position !== null ? `Step ${card.position}` : `Screen ${index + 1}`}</strong><span>{pixels(card.key) ? pixels(card.key) : card.capture?.replayOffsetMs != null ? formatDuration(card.capture.replayOffsetMs) : 'Time not reported'}</span></div>{/if}
      <a href={card.image.url} target="_blank" rel="noreferrer" aria-label="Open Run screenshot {index + 1} full size"><img use:readPixels={card.key} src={card.image.url} alt="Run screenshot {index + 1} of {cards.length}" style:aspect-ratio={shotAspect(card.key)} /></a>
      {#if graph && card.stepId}<p class="screen-node-title">{card.title}</p>{/if}
      <div class="screenshot-actions">
        {#if graph && card.capture && onSelect && (!terminal || card.capture.replayOffsetMs !== null)}<button onclick={() => onSelect?.(card.capture?.eventId ?? '')} aria-label="Show screenshot {index + 1} in {terminal ? 'replay' : 'transcript'}">{terminal ? 'Replay' : 'View step'} ↗</button>{/if}
        <a href={card.image.url} target="_blank" rel="noreferrer" aria-label="View Run screenshot {index + 1}">View</a>
        <a href={card.image.url} download={`${runId}-screenshot-${index + 1}.png`} aria-label="Download Run screenshot {index + 1}">Download</a>
      </div>
      {:else}
        <div class="screenshot-placeholder" class:is-waiting={card.status === 'Pending' || loading} style:aspect-ratio={frameWidth > 0 && frameHeight > 0 ? `${frameWidth} / ${frameHeight}` : undefined}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6" /></svg></div>
        <figcaption><strong>{card.title}</strong><span>{card.status}</span></figcaption>
      {/if}
    </figure></li>{/each}</ol>{/if}
  </div>
{/snippet}
{#if graph}
  <section class="screengraph" aria-label="Screengraph">
    <header><div><h3>Visual journey</h3><p>Captured screens linked to this Run’s steps.</p></div><span>{shotCount} {shotCount === 1 ? 'screen' : 'screens'}</span></header>
    {@render content()}
  </section>
{:else}
  <section class="run-evidence-disclosure">
    <h3><span>{title}</span><small>{shotCount}</small></h3>
    {@render content()}
  </section>
{/if}

<style>
  .screengraph header { display: flex; justify-content: space-between; align-items: start; gap: 12px; padding: 4px 0 16px; }
  .screengraph h3 { margin: 0 0 4px; font-size: 13px; }
  .screengraph header p { margin: 0; color: var(--muted); font-size: 12px; }
  .screengraph header > span { white-space: nowrap; color: var(--muted); font: 11px var(--font-mono); }
  .is-graph { padding: 0; }
  .is-graph .run-evidence-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; margin: 0; padding: 0; list-style: none; }
  .is-graph li { min-width: 0; border: 1px solid var(--line-soft); background: var(--paper-soft); }
  .is-graph li.is-selected { outline: 2px solid var(--accent); outline-offset: 2px; }
  .is-graph figure { display: flex; flex-direction: column; margin: 0; padding: 10px; }
  .is-graph .screen-node-heading { order: 1; }
  .is-graph a { order: 2; }
  .is-graph .screen-node-title { order: 3; }
  .is-graph .screenshot-actions { order: 4; }
  .is-graph figcaption { order: 5; }
  .is-graph img { display: block; width: 100%; max-height: none; height: auto; object-fit: contain; background: #0b0b0e; }
  .screen-node-heading { display: flex; justify-content: space-between; gap: 8px; padding-bottom: 8px; font: 11px var(--font-mono); }
  .screen-node-title { font-size: 12px; line-height: 1.5; }
  .run-evidence-disclosure h3 { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0; padding: 12px 0; font: 700 11px var(--font-mono); text-transform: uppercase; }
  .run-evidence-content:not(.is-graph) { padding: 0 0 12px; }
  .run-evidence-content:not(.is-graph) .run-evidence-gallery { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; align-items: stretch; }
  .run-evidence-content:not(.is-graph) li { display: flex; min-width: 0; }
  .run-evidence-content:not(.is-graph) figure { display: flex; flex-direction: column; width: 100%; margin: 0; border: 1px solid var(--line-soft); background: var(--surface); }
  .run-evidence-content:not(.is-graph) a { order: 1; display: block; background: var(--paper-soft); }
  .run-evidence-content:not(.is-graph) img { display: block; width: 100%; max-height: none; height: auto; object-fit: contain; background: var(--paper-soft); }
  .screenshot-placeholder { display: grid; place-items: center; width: 100%; min-height: 96px; max-height: none; height: auto; background: var(--paper-soft); color: var(--muted); overflow: hidden; }
  .screenshot-placeholder.is-waiting { background: linear-gradient(100deg, var(--paper-soft) 30%, var(--surface) 50%, var(--paper-soft) 70%); background-size: 200% 100%; animation: screenshot-shimmer 1.6s ease-in-out infinite; }
  .is-graph .screenshot-placeholder { background: #0b0b0e; }
  .is-graph .screenshot-placeholder.is-waiting { background: linear-gradient(100deg, #0b0b0e 30%, #22232a 50%, #0b0b0e 70%); background-size: 200% 100%; }
  .screenshot-placeholder svg { position: relative; z-index: 1; width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: square; stroke-linejoin: miter; }
  @keyframes screenshot-shimmer { from { background-position: 100% 0; } to { background-position: -100% 0; } }
  @media (prefers-reduced-motion: reduce) { .screenshot-placeholder.is-waiting { animation: none; } }
  .run-evidence-content:not(.is-graph) figcaption { order: 2; display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-height: 32px; padding: 8px 8px 0; }
  .run-evidence-content:not(.is-graph) figcaption strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; font-weight: 600; }
  .run-evidence-content:not(.is-graph) figcaption span { flex: 0 0 auto; }
  .screenshot-actions button { padding: 6px 10px; color: var(--text); background: var(--surface-raised); font-size: 12px; }
  .screenshot-actions { display: flex; align-items: center; gap: 8px; padding: 8px 0; }
  .run-evidence-content:not(.is-graph) .screenshot-actions { order: 3; margin-top: auto; padding: 6px 8px 8px; }
  .screenshot-actions a { padding: 6px 10px; border: 1px solid var(--line-soft); border-radius: 0; color: var(--text); font-size: 12px; text-decoration: none; }
  .run-evidence-content:not(.is-graph) .screenshot-actions a { padding: 0; border: 0; background: transparent; color: var(--muted); font: 600 11px var(--font-mono); letter-spacing: .04em; text-transform: uppercase; }
  .screenshot-actions a:hover { border-color: var(--accent-strong); color: var(--text); }
  .screenshot-actions a:focus-visible { outline: 2px solid var(--accent-strong); outline-offset: 2px; }
  @container run-summary (max-width: 420px) { .run-evidence-content:not(.is-graph) .run-evidence-gallery { grid-template-columns: 1fr; } }
  @media (max-width: 900px) { .screenshot-actions a { min-height: 44px; display: inline-flex; align-items: center; } }
</style>
