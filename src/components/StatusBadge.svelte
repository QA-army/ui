<script lang="ts">
  let { status }: {
    status: "ready" | "queued" | "provisioning" | "running" | "passed" | "flaky" | "failed" | "error" | "cancelled" | "mocked";
  } = $props();
  const labels = {
    ready: "Ready",
    queued: "Queued",
    provisioning: "Provisioning",
    running: "Running",
    passed: "Passed",
    flaky: "Flaky",
    failed: "Failed",
    error: "Error",
    cancelled: "Cancelled",
    mocked: "Mocked",
  };
</script>

<span class="badge {status}">{labels[status]}</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 6px;
    border: 0;
    border-radius: 0;
    background: #59616e;
    color: #ffffff;
    font: 600 10px / 1.4 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  .ready { background: #8b93a0; color: #0b0b0e; }
  .queued { background: #59616e; }
  .provisioning { background: #3a4250; }
  .running { background: #2563eb; }
  .flaky { background: #4eada3; color: #0b0b0e; }
  .passed { background: #079447; }
  .failed { background: #c4372d; }
  .error { background: #ffe500; color: #0b0b0e; }
  .cancelled { background: #737373; }
  .mocked { background: #e09b14; color: #0b0b0e; }
</style>
