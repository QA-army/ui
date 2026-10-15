<script lang="ts">
  import { untrack } from 'svelte';
  import ReplayControls from './ReplayControls.svelte';
  import type { RunClient } from './model';
  import type { RunTimelineStep } from './run-transcript';
  import { replayRate, type ReplaySpeed } from './replay-speed';
  import { formatDuration } from './run-detail-model';
  let { runs, runId, terminal, liveViewReady, selectedOffsetMs, selectedStepId, seekVersion, timeline, totalSteps, elapsedMs, viewport = null, onSelect, onPlayback, onRecording }: {
    runs: RunClient; runId: string; terminal: boolean; liveViewReady: boolean; selectedOffsetMs: number | null; selectedStepId: string | null; seekVersion: number;
    onRecording?: (value: { runId: string; url: string | null; mediaType: string; error: string | null }) => void;
    viewport?: { width: number; height: number } | null;
    timeline: readonly RunTimelineStep[]; totalSteps: number; elapsedMs: number; onSelect: (id: string) => void; onPlayback: (id: string) => void;
  } = $props();
  let mediaUrl = $state<string | null>(null);
  let liveUrl = $state<string | null>(null);
  let mediaFailure = $state<string | null>(null);
  let liveViewport = $state<{ width: number; height: number } | null>(null);
  let dimensions = $derived(terminal ? viewport : liveViewport ?? viewport);
  let speed = $state<ReplaySpeed>('1');
  let actualRate = $state(1);
  let video = $state<HTMLVideoElement>();
  let recordingDuration = $state(0);
  let positionMs = $state(0);
  let playing = $state(false);
  let playPending = $state(false);
  let playbackError = $state<string | null>(null);
  let replayStage = $state<HTMLDivElement>();
  let display = $state<HTMLDivElement>();
  let displaySize = $state({ width: 0, height: 0 });
  let videoSize = $state<{ width: number; height: number } | null>(null);
  let pictureSize = $derived(videoSize ?? dimensions);
  let sourceSize = $derived(pictureSize ?? displaySize);
  let mediaScale = $derived(sourceSize.width > 0 && sourceSize.height > 0
    ? Math.max(0, Math.min(displaySize.width / sourceSize.width, displaySize.height / sourceSize.height)) : 1);
  let retry = $state(0);
  // Resize only the media pixels; transport controls are outside this display.
  $effect(() => {
    const element = display;
    if (!element) return;
    const measure = (width: number, height: number) => { displaySize = { width: Math.max(0, width), height: Math.max(0, height) }; };
    measure(element.clientWidth, element.clientHeight);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const entry = entries.find(candidate => candidate.target === element);
      if (entry) measure(entry.contentRect.width, entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  });
  let timelineExtent = $derived(Math.max(0, elapsedMs, ...timeline.map(step => step.completedReplayOffsetMs ?? step.replayOffsetMs)));
  // The bar, the readout, and the step marks share one clock. A recording shorter than the
  // transcript still plays, mapped across the transcript so a scrub lands on the right step.
  let playbackDuration = $derived(recordingDuration > 0 ? Math.max(recordingDuration, timelineExtent) : timelineExtent);
  let completed = $derived(timeline.filter(step => step.outcome !== 'STARTED').length);
  let count = $derived(Math.max(totalSteps, timeline.length));
  let selected = $derived(timeline.find(step => step.stepId === selectedStepId) ?? timeline.at(-1));

  // The effect owns one capability-refresh timer or one verified recording Blob.
  $effect(() => {
    const client = runs, id = runId, final = terminal, ready = liveViewReady; retry;
    let active = true; let timer: ReturnType<typeof setTimeout> | undefined; let objectUrl: string | null = null;
    onRecording?.({ runId: id, url: null, mediaType: 'video/mp4', error: null });
    videoSize = null; mediaUrl = null; liveUrl = null; liveViewport = null; mediaFailure = null; recordingDuration = 0; positionMs = 0; playing = false; playbackError = null; playPending = false;
    if (final) void client.loadReplayVideo(id).then(recording => {
      if (!active) return;
      objectUrl = URL.createObjectURL(new Blob([recording.bytes as Uint8Array<ArrayBuffer>], { type: recording.mediaType }));
      mediaUrl = objectUrl;
      onRecording?.({ runId: id, url: objectUrl, mediaType: recording.mediaType, error: null });
    }).catch(error => { if (active) { mediaFailure = error instanceof Error ? error.message : 'Finalized replay is unavailable.'; onRecording?.({ runId: id, url: null, mediaType: 'video/mp4', error: mediaFailure }); } });
    else if (ready) {
      const issue = async () => {
        try {
          const capability = await client.getLiveView(id);
          if (!active) return;
          liveUrl = capability.url; liveViewport = capability.viewport; mediaFailure = null;
          timer = setTimeout(() => { void issue(); }, Math.max(1000, Math.min(90000, Date.parse(capability.expiresAt) - Date.now() - 10000)));
        } catch (error) {
          if (active) { liveUrl = null; mediaFailure = error instanceof Error ? error.message : 'Live View is unavailable.'; }
        }
      };
      void issue();
    }
    return () => { active = false; if (timer) clearTimeout(timer); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  });
  // Explicit seeks must not run on playback-follow selection updates. Reading the
  // offset inside this effect still retriggers it, so ignore runs that are not a new seek.
  let seenSeek = -1;
  let seenVideo = false;
  $effect(() => {
    const version = seekVersion;
    const element = video;
    untrack(() => {
      const versionChanged = version !== seenSeek;
      const videoArrived = Boolean(element) && !seenVideo;
      seenSeek = version;
      seenVideo = Boolean(element);
      if (element && (versionChanged || videoArrived)) seek(element);
      else if (!element && versionChanged && version > 0 && selectedOffsetMs !== null && Number.isFinite(selectedOffsetMs)) positionMs = Math.max(0, Math.min(playbackDuration > 0 ? playbackDuration : selectedOffsetMs, selectedOffsetMs));
    });
  });
  $effect(() => { const element = video; speed; timeline; if (element) untrack(() => updateRate(element)); });
  function timelineClock(mediaMs: number) {
    if (recordingDuration > 0 && playbackDuration > recordingDuration) return mediaMs / recordingDuration * playbackDuration;
    return mediaMs;
  }
  function mediaClock(timelineMs: number) {
    if (recordingDuration > 0 && playbackDuration > recordingDuration) return timelineMs / playbackDuration * recordingDuration;
    return timelineMs;
  }
  function updateRate(element: HTMLVideoElement) {
    const rate = replayRate(speed, timelineClock(element.currentTime * 1000), timeline);
    element.playbackRate = rate; actualRate = rate;
  }
  function adjacent(direction: -1 | 1) {
    const offset = video && Number.isFinite(video.currentTime) ? timelineClock(video.currentTime * 1000) : positionMs;
    const ordered = [...timeline].sort((a, b) => a.replayOffsetMs - b.replayOffsetMs);
    const next = direction === 1 ? ordered.find(step => step.replayOffsetMs > offset + 1)
      : ordered.filter(step => step.replayOffsetMs < offset - 1).at(-1);
    if (next) onSelect(next.eventId);
  }
  function seek(element: HTMLVideoElement) {
    if (selectedOffsetMs === null || !Number.isFinite(element.duration) || element.duration <= 0) return;
    const timelineMs = Math.max(0, Math.min(playbackDuration > 0 ? playbackDuration : selectedOffsetMs, selectedOffsetMs));
    element.currentTime = Math.max(0, Math.min(element.duration, mediaClock(timelineMs) / 1000));
    // A short sample recording is mapped onto the transcript. Reading the video clock back
    // would quantize the playhead off the step the person selected.
    positionMs = recordingDuration > 0 && playbackDuration > recordingDuration ? timelineMs : timelineClock(element.currentTime * 1000);
  }
  function scrub(offsetMs: number) {
    if (!Number.isFinite(offsetMs) || playbackDuration <= 0) return;
    const next = Math.max(0, Math.min(playbackDuration, offsetMs));
    positionMs = next;
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = Math.max(0, Math.min(video.duration, mediaClock(next) / 1000));
      updateRate(video);
    }
    follow(next);
  }
  function onMediaTime(element: HTMLVideoElement, report: boolean) {
    const scaled = recordingDuration > 0 && playbackDuration > recordingDuration;
    if (!(scaled && element.paused)) positionMs = timelineClock(element.currentTime * 1000);
    updateRate(element);
    if (report && !(scaled && element.paused)) follow(positionMs);
  }
  async function togglePlayback() {
    const element = video;
    if (!element || playPending) return;
    playbackError = null;
    if (!element.paused && !element.ended) { element.pause(); return; }
    playPending = true;
    try { await element.play(); }
    catch { if (video === element && element.isConnected) playbackError = 'Playback could not start. Try Play again.'; }
    finally { if (video === element && element.isConnected) playPending = false; }
  }
  async function toggleFullscreen() {
    const stage = replayStage;
    if (!stage) return;
    try {
      if (document.fullscreenElement === stage) await document.exitFullscreen();
      else await stage.requestFullscreen();
    } catch { if (stage.isConnected) playbackError = 'Fullscreen is unavailable in this browser.'; }
  }
  function follow(offset: number) {
    const step = [...timeline].reverse().find(candidate => candidate.replayOffsetMs <= offset + 250) ?? timeline[0];
    if (step && step.stepId !== selectedStepId) onPlayback(step.eventId);
  }
  const label = (step: RunTimelineStep) => `Step ${step.position} ${step.outcome === 'STARTED' ? 'started' : step.outcome === 'ERROR' ? 'needs attention' : step.outcome.toLowerCase()} at ${formatDuration(step.replayOffsetMs)}: ${step.title}`;
  function mark(offsetMs: number) {
    if (playbackDuration <= 0) return 0;
    return Math.min(100, Math.max(0, offsetMs / playbackDuration * 100));
  }
</script>
<section class="recording-replay" aria-labelledby="recording-replay-title">
        <div class="replay-stage" bind:this={replayStage}>
        <div class="media-frame-heading">
          <!-- "Full-Chrome" stays off this heading. The mode sits on the left; resolution and Chrome sit on the right. -->
          <h2 id="recording-replay-title">{terminal ? 'Replay' : 'Live View'}</h2>
          <span class="media-frame-heading__viewport" aria-label="Browser viewport">{pictureSize ? `${pictureSize.width} × ${pictureSize.height} · Chrome` : 'Viewport pending'}</span>
          <!-- Heading notes stay off the page: "View only", "Preparing evidence". The title and viewport are enough. -->
        </div>
        <div class="recording-display" style:--banner-aspect={pictureSize && pictureSize.width > 0 && pictureSize.height > 0 ? `${pictureSize.width} / ${pictureSize.height}` : '16 / 10'} bind:this={display} role="region" aria-label={terminal ? 'Recording display' : 'Live View display'}>
        <div class="browser-media__viewport {terminal ? 'is-replay' : 'is-live'}" style:width="{sourceSize.width * mediaScale}px" style:height="{sourceSize.height * mediaScale}px">
          {#if liveUrl || mediaUrl}
          {#if liveUrl}<iframe style:width="{sourceSize.width}px" style:height="{sourceSize.height}px" style:transform="scale({mediaScale})" class="browser-media__live" title="Read-only full-Chrome Live View" src={liveUrl} referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin"></iframe>{/if}
          {#if mediaUrl}
            <!-- svelte-ignore a11y_media_has_caption -->
            <video bind:this={video} class="browser-media__video" style:width="{sourceSize.width}px" style:height="{sourceSize.height}px" style:transform="scale({mediaScale})" src={mediaUrl} playsinline disablepictureinpicture preload="metadata" aria-label="Authoritative full-Chrome recording" onloadedmetadata={event => { videoSize = event.currentTarget.videoWidth > 0 && event.currentTarget.videoHeight > 0 ? { width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight } : null; recordingDuration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration * 1000 : 0; seek(event.currentTarget); updateRate(event.currentTarget); }} ondurationchange={event => { recordingDuration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration * 1000 : 0; }} onplay={() => { playing = true; playbackError = null; }} onpause={() => { playing = false; }} onended={() => { playing = false; }} onerror={() => { playing = false; playbackError = 'The recording could not be played. Retry media to reload it.'; }} onseeking={event => onMediaTime(event.currentTarget, false)} ontimeupdate={event => onMediaTime(event.currentTarget, true)}></video>
          {/if}
        {:else}<div class="recording-replay__empty">{#if mediaFailure}<h3>{terminal ? 'Recording evidence unavailable' : 'Live View unavailable'}</h3><p role="alert">{mediaFailure}</p>{:else}<p role="status">{terminal ? 'Loading verified replay…' : liveViewReady ? 'Preparing Live View…' : 'Live View is not available yet. It appears only when this Run reports a supported viewer.'}</p>{/if}</div>{/if}
        </div>
        </div>
        {#snippet achievementTimeline()}
        {#if timeline.length > 0}<section class="run-achievement-timeline" aria-label="Test achievement timeline">
          <span class="visually-hidden" aria-live="polite">Step {selected?.position} of {count} · {selected?.outcome === 'STARTED' ? 'In progress' : selected?.outcome.toLowerCase()}</span>
          <div class="run-achievement-timeline__rail" aria-label="{completed} of {count} test steps complete">
            {#each timeline as step (`${step.stepId}:${step.attempt}`)}
              {#if terminal}<button class="run-achievement-stamp run-achievement-stamp--{step.outcome.toLowerCase()} {step.stepId === selected?.stepId ? 'is-selected' : ''}" style:left="{mark(step.replayOffsetMs)}%" aria-label={label(step)} aria-current={step.stepId === selected?.stepId ? 'step' : undefined} title={label(step)} onclick={() => onSelect(step.eventId)}></button>
              {:else}<span class="run-achievement-stamp run-achievement-stamp--{step.outcome.toLowerCase()}" style:left="{mark(step.replayOffsetMs)}%" role="img" aria-label={label(step)}></span>{/if}
            {/each}
          </div>
        </section>{/if}
        {/snippet}
        <!-- Play, speed, and fullscreen need a recording. Seeking and step marks share the transcript clock
             even when that recording is missing. Live keeps the same bar and does not seek. -->
        {#if terminal}
          <ReplayControls enabled={Boolean(mediaUrl)} canSeek={playbackDuration > 0} {playing} pending={playPending} {positionMs} durationMs={playbackDuration} {speed} {actualRate} hasSteps={timeline.length > 0} canFullscreen={Boolean(replayStage?.requestFullscreen)} retryAvailable={Boolean(mediaFailure || playbackError)} error={playbackError} onToggle={() => { void togglePlayback(); }} onSeek={scrub} onSpeed={value => { speed = value; }} onStep={adjacent} onFullscreen={() => { void toggleFullscreen(); }} onRetry={() => { retry += 1; }}>
            {@render achievementTimeline()}
          </ReplayControls>
        {:else}
          <ReplayControls label="Live View controls" enabled={false} canSeek={false} playing={false} pending={false} positionMs={Math.min(elapsedMs, playbackDuration)} durationMs={playbackDuration} speed="1" actualRate={1} hasSteps={timeline.length > 0} canFullscreen={false} retryAvailable={false} error={null} onToggle={() => {}} onSeek={() => {}} onSpeed={() => {}} onStep={() => {}} onFullscreen={() => {}} onRetry={() => {}}>
            {@render achievementTimeline()}
          </ReplayControls>
        {/if}
        </div>
  <!-- Media verification, capability expiry and Workspace authorization belong to
       the adapter. Customer copy describes the viewing experience.
       Notes kept out of the page: "Select a step to replay that moment."
       "Follow the browser as the test runs." -->
</section>
<style>
  .recording-replay { padding: 0; display: flex; flex-direction: column; height: auto; min-height: 0; box-sizing: border-box; }
  .replay-stage {
    /* The picture is the hero: full width of the column, height from its own pixels. */
    --surface: #16171b;
    --surface-raised: #16171b;
    --paper-soft: #22242a;
    --line-soft: #24252a;
    --line: #44464f;
    --text: #e5e3de;
    --muted: #a9a9b0;
    --success: #079447;
    --danger: #c4372d;
    display: flex; flex-direction: column; height: auto; min-height: 0;
    background: #0b0b0e; color: var(--text);
  }
  .media-frame-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 32px; padding: 6px 12px; border-bottom: 1px solid #24252a; background: #16171b; color: #a9a9b0; font: 12px/1.5 var(--font-mono); }
  .media-frame-heading h2 { margin: 0; color: #e5e3de; font: 600 12px/1.5 var(--font-mono); text-align: left; }
  .media-frame-heading__viewport { margin-left: auto; text-align: right; }
  .recording-display { width: 100%; height: auto; aspect-ratio: var(--banner-aspect, 16 / 10); min-height: 0; padding: 0; box-sizing: border-box; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .recording-display .browser-media__viewport { flex: none; background: #fffefa; outline: 1px solid #44464f; outline-offset: -1px; }
  .recording-display .browser-media__video { position: absolute; top: 0; left: 0; max-width: none; aspect-ratio: auto; border: 0; object-fit: fill; transform-origin: top left; }
  .recording-display .browser-media__live { position: absolute; inset: 0; max-width: none; aspect-ratio: auto; transform-origin: top left; }
  .recording-display .recording-replay__empty { width: 100%; height: 100%; min-height: 0; box-sizing: border-box; overflow: auto; }
  @media (max-width: 900px) {
    .recording-replay, .replay-stage, .recording-display { height: auto; }
  }

  /* The area around the recording stays a dark grey in both themes. The empty box stays darker. */
  .recording-display { min-width: 0; background: #2c2e36; }
  .recording-display .recording-replay__empty { color: #a9a9b0; background: #16171b; border: 1px solid #44464f; }
  .recording-replay__empty h3 { margin: 0; color: #e5e3de; font-size: 14px; line-height: 1.5; }
  .recording-replay__empty p { margin: 8px 0 0; max-width: 48ch; font-size: 12px; line-height: 1.6; }
  .replay-stage:fullscreen { height: 100%; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; background: var(--surface-raised); padding: 12px; overflow: auto; }
  .replay-stage:fullscreen .recording-display { aspect-ratio: auto; height: auto; min-height: 0; }
  .run-achievement-timeline { position: absolute; inset: 0 5px; height: 100%; margin: 0; pointer-events: none; }
  .run-achievement-timeline__rail { height: 100%; background: transparent; }
  .run-achievement-timeline .run-achievement-stamp { pointer-events: auto; width: 12px; min-width: 12px; height: 32px; min-height: 32px; border: 0; background: transparent; color: var(--muted); box-shadow: none; transform: translate(-50%, -50%); animation: none; }
  .run-achievement-timeline .run-achievement-stamp:hover,
  .run-achievement-timeline .run-achievement-stamp:focus-visible,
  .run-achievement-timeline .run-achievement-stamp.is-selected { transform: translate(-50%, -50%); box-shadow: none; background: transparent; }
  .run-achievement-stamp::after { content: ''; position: absolute; width: 2px; height: 8px; left: 50%; top: 50%; transform: translate(-50%, -50%); background: currentColor; opacity: .9; }
  .run-achievement-timeline .run-achievement-stamp--passed { color: var(--success); }
  .run-achievement-timeline .run-achievement-stamp--failed, .run-achievement-timeline .run-achievement-stamp--error { color: var(--danger); }
  .run-achievement-stamp.is-selected::after, .run-achievement-stamp:hover::after { opacity: 1; height: 14px; }
  .run-achievement-timeline .run-achievement-stamp:focus-visible { outline: 1px solid var(--accent-strong); outline-offset: 0; }
  @media (max-width: 760px) { .run-achievement-timeline .run-achievement-stamp { height: 44px; min-height: 44px; } }
  .recording-replay__empty { min-height: 0; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; }
</style>
