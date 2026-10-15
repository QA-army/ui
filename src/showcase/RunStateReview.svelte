<script lang="ts">
  import "../run/run-workbench.css";
  import "../run/run-page.css";
  import RunSummary from "../run/RunSummary.svelte";
  import type { RunStatus } from "../run/model";

  const states: {
    status: RunStatus;
    clock: string;
    live: boolean;
    quiet: string | null;
    action: "stop" | "rerun" | null;
    passed: number;
    failed: number;
    errors: number;
    elapsedMs: number;
  }[] = [
    { status: "READY", clock: "0:00", live: false, quiet: "Ready", action: null, passed: 0, failed: 0, errors: 0, elapsedMs: 0 },
    { status: "QUEUED", clock: "0:02", live: true, quiet: null, action: "stop", passed: 0, failed: 0, errors: 0, elapsedMs: 2_000 },
    { status: "PROVISIONING", clock: "0:08", live: true, quiet: null, action: "stop", passed: 0, failed: 0, errors: 0, elapsedMs: 8_000 },
    { status: "RUNNING", clock: "0:18", live: true, quiet: null, action: "stop", passed: 1, failed: 0, errors: 0, elapsedMs: 18_000 },
    { status: "PASSED", clock: "0:42", live: false, quiet: null, action: "rerun", passed: 4, failed: 0, errors: 0, elapsedMs: 42_000 },
    { status: "FLAKY", clock: "0:42", live: false, quiet: null, action: "rerun", passed: 3, failed: 1, errors: 0, elapsedMs: 42_000 },
    { status: "FAILED", clock: "0:36", live: false, quiet: null, action: "rerun", passed: 2, failed: 1, errors: 0, elapsedMs: 36_000 },
    { status: "ERROR", clock: "0:12", live: false, quiet: null, action: "rerun", passed: 1, failed: 0, errors: 1, elapsedMs: 12_000 },
    { status: "CANCELLED", clock: "0:21", live: false, quiet: null, action: "rerun", passed: 1, failed: 0, errors: 0, elapsedMs: 21_000 },
    { status: "MOCKED", clock: "0:42", live: false, quiet: null, action: "rerun", passed: 4, failed: 0, errors: 0, elapsedMs: 42_000 },
  ];
</script>

<div class="state-review run-shell">
  {#each states as state (state.status)}
    <article>
      <header class="run-header">
        <div class="run-header__identity">
          <span class="run-status-dot run-status-dot--{state.status.toLowerCase()}" aria-hidden="true"></span>
          <div>
            <h1>Checkout</h1>
            <p>Oct 15, 2026, 3:58 PM</p>
          </div>
        </div>
        <div class="run-header__actions">
          {#if state.quiet}
            <span class="run-connection" role="status"><i aria-hidden="true"></i>{state.quiet}</span>
          {/if}
          {#if state.status !== "RUNNING"}
            <strong class="run-badge run-badge--{state.status.toLowerCase()}">{state.status}</strong>
          {/if}
          <strong class="run-header__duration" class:run-header__duration--live={state.live}>{state.clock}</strong>
          {#if state.action === "rerun"}
            <button class="run-header-cta run-rerun" type="button">Rerun</button>
          {:else if state.action === "stop"}
            <button class="run-header-cta run-stop" type="button"><span aria-hidden="true">■</span>Stop Test</button>
          {/if}
        </div>
      </header>
      {#if state.status === "RUNNING"}
        <p class="chip"><span class="step-outcome step-outcome--started">RUNNING</span></p>
      {/if}
      <RunSummary status={state.status} passedSteps={state.passed} failedSteps={state.failed} errorSteps={state.errors} elapsedMs={state.elapsedMs} />
    </article>
  {/each}
</div>

<style>
  .state-review { min-height: 0; display: grid; gap: 28px; background: transparent; }
  article { border: 1px solid var(--line-soft); background: var(--surface-raised); }
  .chip { margin: 0; padding: 8px 16px; border-bottom: 1px solid var(--line-soft); }
</style>
