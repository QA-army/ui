<script lang="ts">
  let { status }: { status: "passed" | "failed" | "error" | "ready" | "cancelled" } = $props();
  const labels = { passed: "Passed", failed: "Failed", error: "Error", ready: "Ready", cancelled: "Cancelled" };
</script>

<span class="badge {status}">{labels[status]}</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    padding: 2px 8px;
    border-radius: 0;
    background: var(--run-ready, #59616e);
    color: #ffffff;
    font: 600 10px / 1.4 var(--font-mono, ui-monospace, monospace);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .passed { background: var(--run-passed, #079447); }
  .failed, .error { background: var(--run-failed, #c4372d); }
</style>
