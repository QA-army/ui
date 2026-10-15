<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ReplaySpeed } from './replay-speed';
  import { formatDuration } from './run-detail-model';
  let { enabled, canSeek, playing, pending, positionMs, durationMs, speed, actualRate, hasSteps,
    canFullscreen, retryAvailable, error, onToggle, onSeek, onSpeed, onStep, onFullscreen, onRetry, label = 'Replay controls', children }: {
    enabled: boolean; canSeek: boolean; playing: boolean; pending: boolean; positionMs: number; durationMs: number;
    speed: ReplaySpeed; actualRate: number; hasSteps: boolean; canFullscreen: boolean;
    retryAvailable: boolean; error: string | null; label?: string;
    onToggle: () => void; onSeek: (offsetMs: number) => void; onSpeed: (speed: ReplaySpeed) => void;
    onStep: (direction: -1 | 1) => void; onFullscreen: () => void; onRetry: () => void; children?: Snippet;
  } = $props();
</script>

<!-- Same transport for replay and live. Play needs a recording. Seeking follows the shared clock
     when `canSeek` is set, including a finished Run whose recording file is missing. -->
<section class="replay-control-panel" aria-label={label}>
  <div class="replay-control-panel__transport">
    <button class="replay-control-panel__play" disabled={!enabled || pending} aria-label={playing ? 'Pause recording' : 'Play recording'} onclick={onToggle}>{#if playing}<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 2.5h2.4v9H3.5zM8.1 2.5h2.4v9H8.1z" /></svg>{:else}<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M4.6 2.2 4.6 11.8 12 7z" /></svg>{/if}</button>
    <button class="replay-control-panel__step" disabled={!canSeek || !hasSteps} aria-label="Previous step in replay" title="Previous step" onclick={() => onStep(-1)}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M9 2.5 4 7l5 4.5" /></svg></button>
    <button class="replay-control-panel__step" disabled={!canSeek || !hasSteps} aria-label="Next step in replay" title="Next step" onclick={() => onStep(1)}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M5 2.5 10 7 5 11.5" /></svg></button>
    <output class="replay-control-panel__time" aria-label="Playback time">{formatDuration(Math.min(positionMs, durationMs))} / {formatDuration(durationMs)}</output>
    <div class="replay-control-panel__seek">
    <input class="replay-control-panel__scrubber" type="range" min="0" max={Math.max(1, durationMs)} step="100" value={Math.min(Math.max(0, positionMs), Math.max(0, durationMs))} disabled={!canSeek || durationMs <= 0} aria-label="Playback position" aria-valuemin={0} aria-valuemax={Math.max(0, durationMs)} aria-valuenow={Math.min(Math.max(0, positionMs), Math.max(0, durationMs))} aria-valuetext={`${formatDuration(positionMs)} of ${formatDuration(durationMs)}`} oninput={event => onSeek(event.currentTarget.valueAsNumber)} />
    {#if children}{@render children()}{/if}
    </div>
    <select title={speed === 'smart' ? `Smart: ${actualRate}× now; 1× near steps, 4× between` : 'Playback speed'} aria-label="Playback speed" value={speed} disabled={!enabled} onchange={event => onSpeed(event.currentTarget.value as ReplaySpeed)}><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option><option value="smart">Smart</option></select>
    {#if retryAvailable}<button class="replay-control-panel__retry" aria-label="Retry media" title="Retry media" onclick={onRetry}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 6a8 8 0 0 1 14 6M4 12a8 8 0 0 0 14 6" /></svg></button>{/if}
    <button class="replay-control-panel__fullscreen" disabled={!enabled || !canFullscreen} aria-label="Toggle replay fullscreen" onclick={onFullscreen}><svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M2 5V2h3M9 2h3v3M12 9v3H9M5 12H2V9" /></svg></button>
  </div>
  {#if error}<p role="alert">{error}</p>{/if}
</section>

<style>
  .replay-control-panel { padding: 6px 8px; border: 1px solid var(--line-soft); border-top: 1px solid var(--line-soft); border-radius: 0; background: var(--surface-raised); color: var(--text); }
  .replay-control-panel__transport { display: flex; align-items: center; gap: 4px; height: 32px; }
  .replay-control-panel button, .replay-control-panel select { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; min-height: 32px; padding: 0; border: 0; box-shadow: none; border-radius: 0; background: transparent; color: var(--muted); font: 600 12px/32px var(--font-mono); line-height: 32px; cursor: pointer; }
  .replay-control-panel button svg { display: block; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: square; stroke-linejoin: miter; }
  .replay-control-panel .replay-control-panel__play svg { fill: currentColor; stroke: none; }
  .replay-control-panel button:disabled, .replay-control-panel select:disabled, .replay-control-panel input:disabled { opacity: .75; cursor: default; }
  .replay-control-panel .replay-control-panel__play { background: var(--accent); color: #0b0b0e; }
  .replay-control-panel__time { display: inline-flex; align-items: center; height: 32px; padding: 0 6px; white-space: nowrap; font: 12px/1 var(--font-mono); font-variant-numeric: tabular-nums; }
  .replay-control-panel__seek { position: relative; flex: 1; min-width: 80px; height: 32px; }
  .replay-control-panel select { width: 64px; flex-shrink: 0; appearance: none; padding: 0 16px 0 8px; text-align: left; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23a9a9b0' stroke-width='1.5' stroke-linecap='square'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 6px center; background-size: 10px 6px; }
  .replay-control-panel__retry svg { fill: none; stroke: currentColor; }
  .replay-control-panel button:hover:not(:disabled) { color: var(--text); background: var(--paper-soft); }
  .replay-control-panel__scrubber { appearance: none; position: absolute; inset: 0; display: block; width: 100%; height: 100%; margin: 0; padding: 0; border-radius: 0; background: transparent; cursor: pointer; }
  .replay-control-panel__scrubber:disabled { cursor: default; }
  .replay-control-panel__scrubber::-webkit-slider-runnable-track { height: 2px; background: var(--line); border-radius: 0; }
  .replay-control-panel__scrubber::-webkit-slider-thumb { appearance: none; width: 10px; height: 10px; margin-top: -4px; border: 0; border-radius: 0; background: var(--accent-strong); }
  .replay-control-panel__scrubber::-moz-range-track { height: 2px; background: var(--line); border-radius: 0; }
  .replay-control-panel__scrubber::-moz-range-thumb { width: 10px; height: 10px; border: 0; border-radius: 0; background: var(--accent-strong); }
  .replay-control-panel p { margin: 6px 0 0; font: 10px / 1.5 var(--font-mono); color: var(--danger); }
  @media (max-width: 760px) { .replay-control-panel__transport { flex-wrap: nowrap; align-items: center; height: 44px; } .replay-control-panel button, .replay-control-panel select { min-height: 44px; height: 44px; } .replay-control-panel__time { height: 44px; padding: 0 4px; } .replay-control-panel select { width: 52px; padding: 0 14px 0 4px; } .replay-control-panel__seek { flex: 1 1 0; order: 0; min-width: 0; height: 44px; } }
</style>
