<script lang="ts">
  import ActionButton from "../components/ActionButton.svelte";
  import ReplayBar from "../components/ReplayBar.svelte";
  import RunHeader from "../components/RunHeader.svelte";
  import StatusBadge from "../components/StatusBadge.svelte";
  import StepKindBadge from "../components/StepKindBadge.svelte";
  import TextField from "../components/TextField.svelte";
  import Transcript from "../components/Transcript.svelte";
  import { stepKinds, type StepKind } from "../components/step-kind.ts";

  const kinds = Object.keys(stepKinds) as StepKind[];
  const statuses = ["passed", "failed", "error", "ready", "cancelled"] as const;
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

  <section>
    <h2>Run header</h2>
    <div class="stack">
      <RunHeader state="passed" />
      <RunHeader state="live" />
    </div>
  </section>

  <section>
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
  .stack { display: grid; border: 1px solid var(--line-soft); }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .actions { margin-top: 12px; }
</style>
