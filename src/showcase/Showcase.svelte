<script lang="ts">
  import ActionButton from "../components/ActionButton.svelte";
  import desktopError from "../../docs/gallery/desktop-error.png";
  import desktopFailed from "../../docs/gallery/desktop-failed.png";
  import desktopPassed from "../../docs/gallery/desktop-passed.png";
  import desktopReady from "../../docs/gallery/desktop-ready.png";
  import desktopRunning from "../../docs/gallery/desktop-running.png";
  import desktopUnavailable from "../../docs/gallery/desktop-unavailable.png";
  import errorState from "../../docs/gallery/state-error.png";
  import failedState from "../../docs/gallery/state-failed.png";
  import passedState from "../../docs/gallery/state-passed.png";
  import readyState from "../../docs/gallery/state-ready.png";
  import runningState from "../../docs/gallery/state-running.png";
  import unavailableState from "../../docs/gallery/state-unavailable.png";
  import ReplayBar from "../components/ReplayBar.svelte";
  import RunHeader from "../components/RunHeader.svelte";
  import StatusBadge from "../components/StatusBadge.svelte";
  import RunStateReview from "./RunStateReview.svelte";
  import StepKindBadge from "../components/StepKindBadge.svelte";
  import TextField from "../components/TextField.svelte";
  import Transcript from "../components/Transcript.svelte";
  import { stepKinds, type StepKind } from "../components/step-kind.ts";

  const desktopStates = [
    { label: "Passed", src: desktopPassed },
    { label: "Running", src: desktopRunning },
    { label: "Failed", src: desktopFailed },
    { label: "Error", src: desktopError },
    { label: "Ready", src: desktopReady },
    { label: "Unavailable", src: desktopUnavailable },
  ];
  const runStates = [
    { label: "Passed", src: passedState },
    { label: "Running", src: runningState },
    { label: "Failed", src: failedState },
    { label: "Error", src: errorState },
    { label: "Ready", src: readyState },
    { label: "Unavailable", src: unavailableState },
  ];
  const kinds = Object.keys(stepKinds) as StepKind[];
  const statuses = ["ready", "queued", "provisioning", "running", "passed", "flaky", "failed", "error", "cancelled", "mocked"] as const;
  const steps = [
    { number: 1, type: "ACT", title: "Open the pricing page", outcome: "PASSED", time: "0:04" },
    { number: 2, type: "ASSERT", title: "The price is visible", outcome: "FAILED", time: "0:11" },
    { number: 3, type: "SCREENSHOT", title: "Capture the price", outcome: "STARTED", time: "0:18" },
    { number: 4, type: "LOGIN", title: "Sign in with the saved account", outcome: "QUEUED", time: "—", pending: true },
  ];

  const storedTheme = localStorage.getItem("qa-army-ui-theme") === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = storedTheme;
  let theme = $state(storedTheme);

  function setTheme(next: "light" | "dark") {
    theme = next;
    document.documentElement.dataset.theme = next;
    localStorage.setItem("qa-army-ui-theme", next);
  }
</script>

<div class="page">
  <header class="mast">
    <div>
      <p class="mark">QA.army</p>
      <h1>UI</h1>
    </div>
    <button type="button" class="theme" onclick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  </header>

  <section id="review">
    <h2>Run page</h2>
    <RunStateReview />
  </section>

  <section>
    <h2>Desktop</h2>
    <div class="desktop-states">
      {#each desktopStates as item (item.label)}
        <figure>
          <figcaption>{item.label}</figcaption>
          <img src={item.src} alt="{item.label} run on desktop" />
        </figure>
      {/each}
    </div>
  </section>

  <section>
    <h2>Mobile</h2>
    <div class="run-states">
      <table>
        <thead>
          <tr>
            {#each runStates as item (item.label)}
              <th>{item.label}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          <tr>
            {#each runStates as item (item.label)}
              <td><img src={item.src} alt="{item.label} run" /></td>
            {/each}
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <section>
    <h2>Run header</h2>
    <div class="stack">
      <RunHeader state="passed" />
      <RunHeader state="live" />
    </div>
  </section>

  <section id="status">
    <h2>Status</h2>
    <div class="row">
      {#each statuses as status (status)}
        <StatusBadge {status} />
      {/each}
    </div>
  </section>

  <section>
    <h2>Step types</h2>
    <div class="row">
      {#each kinds as kind (kind)}
        <StepKindBadge type={kind} />
      {/each}
    </div>
  </section>

  <section>
    <h2>Transcript</h2>
    <Transcript {steps} />
  </section>

  <section>
    <h2>Playback</h2>
    <ReplayBar />
  </section>

  <section>
    <h2>Instruction</h2>
    <TextField label="Act" value="Open the pricing page" />
    <div class="row actions">
      <ActionButton label="Save test" />
      <ActionButton kind="quiet" label="Cancel" />
    </div>
  </section>
</div>

<style>
  .page { width: min(880px, calc(100% - 32px)); margin: 0 auto; padding: 28px 0 64px; }
  .mast, section { margin-bottom: 28px; }
  .mast { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
  .mark, h2 {
    margin: 0;
    color: var(--muted);
    font: 500 11px / 1.4 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  h1 {
    margin: 4px 0 0;
    color: var(--ink);
    font-family: var(--font-display, "Space Grotesk", sans-serif);
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }
  h2 { margin-bottom: 10px; }
  .theme {
    min-height: 36px;
    padding: 8px 12px;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
    color: var(--muted);
    font: 600 11px / 1 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
  }
  .theme:hover { background: var(--paper-soft); color: var(--ink); }
  .desktop-states { display: grid; gap: 28px; }
  .desktop-states figure { margin: 0; }
  .desktop-states figcaption { margin-bottom: 8px; color: var(--muted); font: 500 11px / 1.4 var(--font-mono, ui-monospace, monospace); letter-spacing: 0.08em; text-transform: uppercase; }
  .desktop-states img { width: 100%; height: auto; display: block; border: 1px solid var(--line-soft); }
  .run-states { overflow-x: auto; }
  .run-states table { border-collapse: collapse; }
  .run-states th { padding: 0 8px 8px; color: var(--muted); font: 500 11px / 1.4 var(--font-mono, ui-monospace, monospace); letter-spacing: 0.08em; text-align: left; text-transform: uppercase; }
  .run-states td { padding: 0 8px; vertical-align: top; }
  .run-states img { width: 280px; height: auto; display: block; border: 1px solid var(--line-soft); }
  .stack { display: grid; border: 1px solid var(--line-soft); }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .actions { margin-top: 12px; }
</style>
