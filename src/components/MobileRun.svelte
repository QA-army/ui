<script lang="ts">
  import ActionButton from "./ActionButton.svelte";
  import OutcomeIcon from "./OutcomeIcon.svelte";
  import StatusBadge from "./StatusBadge.svelte";
  import StepKindBadge from "./StepKindBadge.svelte";

  type Mode = "passed" | "running" | "failed" | "error";
  type Step = { number: number; type: string; title: string; outcome: string; time: string; pending?: boolean };

  let { mode }: { mode: Mode } = $props();

  const steps: Record<Mode, Step[]> = {
    passed: [
      { number: 1, type: "ACT", title: "Open the pricing page", outcome: "PASSED", time: "0:04" },
      { number: 2, type: "ASSERT", title: "The price is visible", outcome: "PASSED", time: "0:09" },
      { number: 3, type: "SCREENSHOT", title: "Capture the price", outcome: "PASSED", time: "0:12" },
      { number: 4, type: "LOGIN", title: "Sign in with the saved account", outcome: "PASSED", time: "0:21" },
    ],
    running: [
      { number: 1, type: "ACT", title: "Open the pricing page", outcome: "PASSED", time: "0:04" },
      { number: 2, type: "ASSERT", title: "The price is visible", outcome: "STARTED", time: "0:18" },
      { number: 3, type: "SCREENSHOT", title: "Capture the price", outcome: "QUEUED", time: "—", pending: true },
      { number: 4, type: "LOGIN", title: "Sign in with the saved account", outcome: "QUEUED", time: "—", pending: true },
    ],
    failed: [
      { number: 1, type: "ACT", title: "Open the pricing page", outcome: "PASSED", time: "0:04" },
      { number: 2, type: "ASSERT", title: "The price is visible", outcome: "FAILED", time: "0:11" },
      { number: 3, type: "SCREENSHOT", title: "Capture the price", outcome: "UNEXECUTED", time: "—", pending: true },
      { number: 4, type: "LOGIN", title: "Sign in with the saved account", outcome: "UNEXECUTED", time: "—", pending: true },
    ],
    error: [
      { number: 1, type: "ACT", title: "Open the pricing page", outcome: "PASSED", time: "0:04" },
      { number: 2, type: "ASSERT", title: "The price is visible", outcome: "ERROR", time: "0:11" },
      { number: 3, type: "SCREENSHOT", title: "Capture the price", outcome: "UNEXECUTED", time: "—", pending: true },
      { number: 4, type: "LOGIN", title: "Sign in with the saved account", outcome: "UNEXECUTED", time: "—", pending: true },
    ],
  };

  const counts = {
    passed: { passed: 4, failed: 0, errored: 0 },
    running: { passed: 1, failed: 0, errored: 0 },
    failed: { passed: 1, failed: 1, errored: 0 },
    error: { passed: 1, failed: 0, errored: 1 },
  };

  let playing = $state(false);
  let position = $state(28);
  let rows = $derived(steps[mode]);
  let tally = $derived(counts[mode]);
</script>

<article class="phone" data-state={mode}>
  <header>
    <div class="name">
      <p>Sample run</p>
      <h3>Checkout</h3>
    </div>
    <button type="button" class="close" aria-label="Close">×</button>
    <div class="tools">
      {#if mode === "running"}
        <span class="live-mark" aria-label="Running"></span>
        <span class="clock">0:18</span>
        <ActionButton kind="stop" label="Stop" />
      {:else}
        <StatusBadge status={mode} />
        <ActionButton kind="rerun" label="Rerun" />
      {/if}
    </div>
  </header>

  <div class="stage">
    <p>{mode === "running" ? "Live View" : mode === "error" ? "Recording" : "Replay"}</p>
    <div class="frame">
      {#if mode === "running"}
        <span>Watching the browser</span>
      {:else if mode === "error"}
        <span>Recording unavailable</span>
      {:else}
        <span>Final recording</span>
      {/if}
    </div>
  </div>

  {#if mode === "passed" || mode === "failed"}
    <div class="transport" role="group" aria-label="Playback">
      <button type="button" aria-label={playing ? "Pause" : "Play"} onclick={() => (playing = !playing)}>{playing ? "Pause" : "Play"}</button>
      <button type="button" aria-label="Previous step">Prev</button>
      <button type="button" aria-label="Next step">Next</button>
      <span>0:12</span>
      <input type="range" min="0" max="100" bind:value={position} aria-label="Seek" />
      <button type="button" aria-label="Fullscreen">Full</button>
    </div>
  {:else if mode === "error"}
    <p class="trust">The result could not be trusted.</p>
  {/if}

  <ol>
    {#each rows as step (step.number)}
      <li>
        <span class="number">{step.number}</span>
        <StepKindBadge type={step.type} reveal="icon" />
        <span class="title" class:pending={step.pending}>{step.title}</span>
        <span class="end">
          {#if step.outcome === "STARTED"}
            <span class="running">Running</span>
          {:else}
            <OutcomeIcon outcome={step.outcome} />
          {/if}
          <time>{step.time}</time>
        </span>
      </li>
    {/each}
  </ol>

  <footer>
    <p>
      {#if mode === "running"}<i class="summary-live" aria-hidden="true"></i>{/if}
      Run summary
    </p>
    <dl>
      <div><dt>Passed</dt><dd>{tally.passed}</dd></div>
      <div><dt>Failed</dt><dd>{tally.failed}</dd></div>
      <div><dt>Errored</dt><dd>{tally.errored}</dd></div>
    </dl>
  </footer>
</article>

<style>
  .phone {
    width: 390px;
    background: var(--paper);
    color: var(--text);
    border: 1px solid var(--line-soft);
  }
  header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 44px;
    gap: 0 8px;
    align-items: center;
    padding: 12px 8px 12px 14px;
    background: var(--surface-raised);
  }
  .name { min-width: 0; }
  .name p, .stage > p, footer > p {
    margin: 0;
    color: var(--muted);
    font: 500 11px / 1.4 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  h3 {
    margin: 2px 0 0;
    color: var(--ink);
    font-family: var(--font-display, "Space Grotesk", sans-serif);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .close {
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    color: var(--ink);
    font: 400 28px / 1 var(--font-display, "Space Grotesk", sans-serif);
    cursor: pointer;
  }
  .tools {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-height: 44px;
  }
  .tools :global(button) { min-height: 44px; }
  .live-mark {
    width: 13px;
    height: 13px;
    background: var(--run-running-dot, #e09b14);
    animation: spin 2s linear infinite;
  }
  .clock {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--run-passed, #079447);
    color: var(--run-passed, #079447);
    font: 600 12px / 1 var(--font-mono, ui-monospace, monospace);
    animation: fade 2s ease-in-out infinite;
  }
  .stage { background: #2c2e36; padding: 12px; }
  .stage > p { color: #f4f1eb; padding-bottom: 8px; }
  .frame {
    display: grid;
    place-items: center;
    min-height: 168px;
    border: 1px solid #44464f;
    background: #16171b;
    color: #a9a9b0;
    font: 500 12px / 1.4 var(--font-mono, ui-monospace, monospace);
  }
  .transport {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 44px;
    padding: 0 4px;
    background: var(--surface-raised);
    border-bottom: 1px solid var(--line-soft);
  }
  .transport button {
    flex: 0 0 auto;
    height: 44px;
    padding: 0 6px;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    color: var(--ink);
    font: 600 11px / 1 var(--font-mono, ui-monospace, monospace);
    text-transform: uppercase;
    cursor: pointer;
  }
  .transport span { color: var(--muted); font: 11px var(--font-mono, ui-monospace, monospace); }
  .transport input {
    flex: 1 1 auto;
    min-width: 0;
    height: 44px;
    margin: 0;
    appearance: none;
    background: transparent;
    border-radius: 0;
  }
  .transport input::-webkit-slider-runnable-track { height: 2px; background: var(--ink); border-radius: 0; }
  .transport input::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    margin-top: -5px;
    border: 0;
    border-radius: 0;
    background: var(--ink);
  }
  .transport input::-moz-range-track { height: 2px; background: var(--ink); border: 0; border-radius: 0; }
  .transport input::-moz-range-thumb { width: 12px; height: 12px; border: 0; border-radius: 0; background: var(--ink); }
  .trust {
    margin: 0;
    padding: 12px 14px;
    background: var(--surface-raised);
    color: var(--run-failed, #c4372d);
    font: 600 13px / 1.4 var(--font-body, Inter, sans-serif);
  }
  ol { margin: 0; padding: 0; list-style: none; background: var(--surface-raised); }
  li {
    display: grid;
    grid-template-columns: max-content max-content minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
    min-height: 44px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--line-soft);
  }
  .number { color: var(--muted); font: 12px var(--font-mono, ui-monospace, monospace); }
  .title { color: var(--ink); font: 700 13px / 1.35 var(--font-body, Inter, sans-serif); }
  .pending { font-weight: 400; }
  .end { display: inline-flex; align-items: center; gap: 8px; }
  time { color: var(--muted); font: 11px var(--font-mono, ui-monospace, monospace); }
  .running {
    padding: 2px 6px;
    background: var(--run-passed, #079447);
    color: #ffffff;
    font: 600 10px / 1.4 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    animation: fade 2s ease-in-out infinite;
  }
  .phone :global(.step-kind-badge[data-kind]) {
    background: color-mix(in srgb, var(--type-paper) 28%, var(--surface-raised));
    color: color-mix(in srgb, var(--type-ink) 28%, var(--muted));
  }
  footer { padding: 14px; background: var(--surface); }
  footer > p { display: flex; align-items: center; gap: 8px; }
  .summary-live {
    width: 8px;
    height: 8px;
    background: var(--run-running-dot, #e09b14);
  }
  dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0 0; }
  dl div { display: grid; gap: 2px; }
  dt { color: var(--muted); font: 500 11px / 1.3 var(--font-mono, ui-monospace, monospace); letter-spacing: 0.04em; text-transform: uppercase; }
  dd { margin: 0; color: var(--ink); font: 600 18px / 1 var(--font-display, "Space Grotesk", sans-serif); }
  @keyframes fade { 50% { opacity: 0.5; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .live-mark, .clock, .running { animation: none; }
  }
</style>
